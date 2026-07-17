import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Worker, Job } from "bullmq";
import { db } from "../../../database/drizzle";
import { applications } from "../../../database/schema/applications";
import { jobs } from "../../../database/schema/jobs";
import { profiles } from "../../../database/schema/profiles";
import { resumes } from "../../../database/schema/resumes";
import { coverLetters } from "../../../database/schema/cover-letters";
import { eq } from "drizzle-orm";
import { BrowserManager } from "../playwright/browser.manager";
import { ContextManager } from "../playwright/context.manager";
import { PageManager } from "../playwright/page.manager";
import { PlaywrightService } from "../playwright/playwright.service";
import { ProviderFactory } from "../providers/provider.factory";
import { AutomationTaskService } from "../services/automation-task.service";
import { ProgressService } from "../services/progress.service";
import { ScreenshotService } from "../services/screenshot.service";
import { RetryService } from "../services/retry.service";
import { AIOrchestratorService } from "../../ai/services/ai-orchestrator.service";
import { AutomationStep } from "../enums/automation-step.enum";
import { AutomationContext } from "../providers/provider.interface";
import { QueueService } from "../queue/queue.service";
import * as fs from "fs/promises";
import * as path from "path";

@Injectable()
export class AutomationWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AutomationWorker.name);
  private worker!: Worker;

  constructor(
    private readonly configService: ConfigService,
    private readonly browserManager: BrowserManager,
    private readonly contextManager: ContextManager,
    private readonly pageManager: PageManager,
    private readonly playwrightService: PlaywrightService,
    private readonly providerFactory: ProviderFactory,
    private readonly taskService: AutomationTaskService,
    private readonly progressService: ProgressService,
    private readonly screenshotService: ScreenshotService,
    private readonly retryService: RetryService,
    private readonly aiOrchestratorService: AIOrchestratorService,
    private readonly queueService: QueueService,
  ) {}

  onModuleInit() {
    const host = this.configService.get<string>("REDIS_HOST") || "127.0.0.1";
    const port = parseInt(this.configService.get<string>("REDIS_PORT") || "6379", 10);
    const password = this.configService.get<string>("REDIS_PASSWORD") || undefined;

    this.worker = new Worker(
      "automation",
      async (job: Job) => {
        return this.processJob(job);
      },
      {
        connection: { host, port, password },
        concurrency: 2, // Allow 2 concurrent automations
      }
    );

    this.worker.on("failed", (job, err) => {
      this.logger.error(`Job ${job?.id} failed: ${err.message}`);
    });

    this.logger.log("BullMQ Automation Worker initialized");
  }

  private async processJob(job: Job) {
    const { taskId, applicationId, userId, reviewBeforeSubmit } = job.data;
    this.logger.log(`Processing automation job ${job.id} for task ${taskId}`);

    await this.progressService.updateStep(taskId, AutomationStep.STARTING, "Starting automation engine");

    // Load DB models
    const [app] = await db.select().from(applications).where(eq(applications.id, applicationId)).limit(1);
    if (!app) throw new Error("Application not found");

    const [jobDetails] = await db.select().from(jobs).where(eq(jobs.id, app.jobId)).limit(1);
    if (!jobDetails) throw new Error("Job posting not found");

    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    if (!profile) throw new Error("User profile not found");

    const [resume] = await db.select().from(resumes).where(eq(resumes.id, app.resumeId)).limit(1);
    if (!resume) throw new Error("Resume not found");

    let coverLetter: any = null;
    if (app.coverLetterId) {
      const [cl] = await db.select().from(coverLetters).where(eq(coverLetters.id, app.coverLetterId)).limit(1);
      coverLetter = cl;
    }

    // Create temp files directory
    const tempDir = path.join(process.cwd(), "uploads", "temp", taskId);
    await fs.mkdir(tempDir, { recursive: true });

    const resumePath = path.join(tempDir, resume.fileName);
    await this.downloadFile(resume.fileUrl, resumePath);

    let coverLetterPath: string | undefined;
    if (coverLetter) {
      coverLetterPath = path.join(tempDir, `CoverLetter_${applicationId}.txt`);
      await fs.writeFile(coverLetterPath, coverLetter.content);
    }

    let browser: any;
    let context: any;
    let page: any;

    try {
      await this.progressService.updateStep(taskId, AutomationStep.LAUNCH_BROWSER, "Launching browser");
      browser = await this.browserManager.launch({ headless: true });
      context = await this.contextManager.create(browser);
      
      await this.progressService.updateStep(taskId, AutomationStep.OPEN_JOB, `Opening job page: ${jobDetails.company}`);
      const jobUrl = jobDetails.applicationUrl || "";
      page = await this.pageManager.open(context, jobUrl);

      const provider = this.providerFactory.getProvider(jobUrl);

      const automationCtx: AutomationContext = {
        page,
        playwrightService: this.playwrightService,
        profile,
        resumePath,
        coverLetterPath,
        application: app,
        aiService: this.aiOrchestratorService,
        log: async (level, step, message) => {
          await this.taskService.log(taskId, level, step, message);
        },
        screenshot: async (step) => {
          await this.screenshotService.captureAndUpload(page, taskId, step);
        },
      };

      await provider.prepare(automationCtx);
      await this.screenshotService.captureAndUpload(page, taskId, "01-launch");

      await this.progressService.updateStep(taskId, AutomationStep.FILL_PROFILE, "Filing application details");
      await provider.execute(automationCtx);

      await this.screenshotService.captureAndUpload(page, taskId, "04-profile-filled");

      if (reviewBeforeSubmit) {
        await this.progressService.updateStep(taskId, AutomationStep.WAITING_FOR_APPROVAL, "Waiting for user review before submission");
        await this.screenshotService.captureAndUpload(page, taskId, "05-review");
      } else {
        await this.progressService.updateStep(taskId, AutomationStep.SUBMITTING, "Submitting job application");
        await provider.submit(automationCtx);
        await this.screenshotService.captureAndUpload(page, taskId, "06-submitted");
        await this.progressService.updateStep(taskId, AutomationStep.COMPLETED, "Application automated successfully");
      }

    } catch (err) {
      this.logger.error(`Error during automation: ${err.message}`);
      await this.taskService.log(taskId, "ERROR", AutomationStep.FAILED, `Automation failed: ${err.message}`);
      
      if (page) {
        await this.screenshotService.captureAndUpload(page, taskId, "07-error").catch(() => {});
      }

      await this.progressService.updateStep(taskId, AutomationStep.FAILED, "Automation failed", err.message);

      // Check for retries
      const shouldRetry = await this.retryService.shouldRetry(taskId, err);
      if (shouldRetry) {
        const retryCount = await this.retryService.incrementRetry(taskId);
        this.logger.log(`Scheduling retry ${retryCount} for task ${taskId}`);
        // Dispatch retry job
        await this.queueService.addJob("automation", "RetryAutomationJob", job.data, {
          delay: 10000 * retryCount, // delay escalates with retry count
          jobId: taskId, // Override or use task id
        });
      }
      throw err;
    } finally {
      if (context) await this.contextManager.destroy(context);
      // Clean up temp folder
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  private async downloadFile(url: string, destPath: string) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download file from ${url}`);
    const arrayBuffer = await response.arrayBuffer();
    await fs.writeFile(destPath, Buffer.from(arrayBuffer));
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
