import { Injectable, Logger } from "@nestjs/common";
import { MemoryService } from "./memory.service";
import { ValidationService } from "./validation.service";
import { SearchJobsTool } from "../tools/search-jobs.tool";
import { ScoreJobTool } from "../tools/score-job.tool";
import { TailorResumeTool } from "../tools/tailor-resume.tool";
import { GenerateCoverLetterTool } from "../tools/cover-letter.tool";
import { CreateApplicationTool } from "../tools/create-application.tool";
import { StartAutomationTool } from "../tools/start-automation.tool";
import { ResumeService } from "../../resume/services/resume.service";
import { AgentTool } from "../tools/agent-tool.interface";

@Injectable()
export class ExecutorService {
  private readonly logger = new Logger(ExecutorService.name);
  private tools: Map<string, AgentTool> = new Map();

  constructor(
    private readonly memoryService: MemoryService,
    private readonly validationService: ValidationService,
    private readonly resumeService: ResumeService,
    searchJobs: SearchJobsTool,
    scoreJob: ScoreJobTool,
    tailorResume: TailorResumeTool,
    coverLetter: GenerateCoverLetterTool,
    createApp: CreateApplicationTool,
    startAuto: StartAutomationTool,
  ) {
    // Register tools
    this.tools.set(searchJobs.name, searchJobs);
    this.tools.set(scoreJob.name, scoreJob);
    this.tools.set(tailorResume.name, tailorResume);
    this.tools.set(coverLetter.name, coverLetter);
    this.tools.set(createApp.name, createApp);
    this.tools.set(startAuto.name, startAuto);
  }

  async executePlan(taskId: string, userId: string) {
    const task = await this.memoryService.getTask(taskId);
    if (task.status === "CANCELED") return;

    await this.memoryService.updateTaskStatus(taskId, "RUNNING");

    // Context dictionary to store intermediate tool outputs
    const context: any = { userId };
    
    // Resolve user's default resume
    try {
      const resumes = await this.resumeService.findAll(userId);
      const defaultResume = resumes.find((r) => r.isDefault) || resumes[0];
      if (defaultResume) {
        context.resumeId = defaultResume.id;
      }
    } catch (err) {
      this.logger.debug(`No default resume found: ${err.message}`);
    }

    const plan = task.executionPlan as { steps: Array<{ type: string; params: any }> };

    try {
      for (let i = 0; i < plan.steps.length; i++) {
        // Check for cancellation at each step
        const currentTask = await this.memoryService.getTask(taskId);
        if (currentTask.status === "CANCELED") {
          this.logger.log(`Task ${taskId} execution canceled at step ${i}`);
          return;
        }

        const step = plan.steps[i];
        const tool = this.tools.get(step.type);
        if (!tool) {
          throw new Error(`Unsupported tool step type: ${step.type}`);
        }

        // Map inputs from previous context if required
        const inputPayload = { ...step.params };
        if (context.jobId && !inputPayload.jobId) inputPayload.jobId = context.jobId;
        if (context.resumeId && !inputPayload.resumeId) inputPayload.resumeId = context.resumeId;
        if (context.applicationId && !inputPayload.applicationId) inputPayload.applicationId = context.applicationId;

        // Perform validations
        this.validationService.validateToolInput(step.type, inputPayload);

        this.logger.log(`Executing step ${i} (${step.type}) for task ${taskId}`);
        await this.memoryService.updateTaskStep(taskId, i, { status: `Running ${step.type}` });

        // Execute tool
        const output = await tool.execute(inputPayload, { userId });

        // Store outputs in context
        if (output) {
          if (output.jobId) context.jobId = output.jobId;
          if (output.tailoredResumeId) context.resumeId = output.tailoredResumeId;
          if (output.applicationId) context.applicationId = output.applicationId;
          if (output.coverLetterId) context.coverLetterId = output.coverLetterId;
          
          // If search returned list of jobs, take the first one
          if (Array.isArray(output) && output.length > 0) {
            context.jobId = output[0].id;
          }
        }

        context[`step_${i}_output`] = output;
      }

      await this.memoryService.updateTaskStatus(taskId, "COMPLETED", context);
      this.logger.log(`Task ${taskId} completed successfully.`);
    } catch (error) {
      this.logger.error(`Execution failed at step for task ${taskId}: ${error.message}`);
      await this.memoryService.updateTaskStatus(taskId, "FAILED", {
        error: error.message,
        partialContext: context,
      });
    }
  }
}
