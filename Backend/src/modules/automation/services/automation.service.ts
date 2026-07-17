import { Injectable, BadRequestException, NotFoundException, ConflictException } from "@nestjs/common";
import { QueueService } from "../queue/queue.service";
import { AutomationTaskService } from "./automation-task.service";
import { db } from "../../../database/drizzle";
import { applications } from "../../../database/schema/applications";
import { jobs } from "../../../database/schema/jobs";
import { automationTasks } from "../../../database/schema/automation-tasks";
import { eq, and, ne } from "drizzle-orm";
import { StartAutomationDto } from "../dto/start-automation.dto";
import { AutomationStep } from "../enums/automation-step.enum";

@Injectable()
export class AutomationService {
  constructor(
    private readonly queueService: QueueService,
    private readonly taskService: AutomationTaskService,
  ) {}

  async startAutomation(userId: string, dto: StartAutomationDto) {
    // 1. Fetch application details
    const [app] = await db
      .select()
      .from(applications)
      .where(and(eq(applications.id, dto.applicationId), eq(applications.userId, userId)))
      .limit(1);

    if (!app) {
      throw new NotFoundException("Application not found");
    }

    // 2. Fetch Job details
    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, app.jobId))
      .limit(1);

    if (!job) {
      throw new NotFoundException("Associated job posting not found");
    }

    // 3. Ensure no active running tasks for this application
    const activeTasks = await db
      .select()
      .from(automationTasks)
      .where(
        and(
          eq(automationTasks.applicationId, dto.applicationId),
          ne(automationTasks.status, AutomationStep.COMPLETED),
          ne(automationTasks.status, AutomationStep.FAILED)
        )
      );

    if (activeTasks.length > 0) {
      throw new ConflictException("An active automation task is already running for this application.");
    }

    // 4. Determine provider from job URL
    let provider = "unknown";
    const url = (job.applicationUrl || "").toLowerCase();
    if (url.includes("greenhouse.io")) provider = "greenhouse";
    else if (url.includes("lever.co")) provider = "lever";
    else if (url.includes("ashbyhq.com")) provider = "ashby";
    else if (url.includes("myworkdayjobs.com")) provider = "workday";
    else {
      throw new BadRequestException("Unsupported job provider URL. Supported: Greenhouse, Lever, Ashby, Workday");
    }

    // 5. Create Database Task
    const task = await this.taskService.createTask(userId, dto.applicationId, provider);

    // 6. Push to Queue
    await this.queueService.addJob("automation", "StartAutomationJob", {
      taskId: task.id,
      applicationId: dto.applicationId,
      userId,
      reviewBeforeSubmit: dto.reviewBeforeSubmit || false,
    }, { jobId: task.id });

    return task;
  }

  async cancelAutomation(userId: string, taskId: string) {
    const task = await this.taskService.getTask(userId, taskId);

    if (task.status === AutomationStep.COMPLETED || task.status === AutomationStep.FAILED) {
      throw new BadRequestException("Task has already finished and cannot be canceled.");
    }

    // Cancel in queue
    await this.queueService.cancelJob("automation", taskId);

    // Update status to failed/canceled
    await this.taskService.updateTaskStatus(
      taskId,
      AutomationStep.FAILED,
      100,
      "Canceled by user",
      "Task canceled by user"
    );

    await this.taskService.log(taskId, "WARNING", AutomationStep.FAILED, "Automation task canceled by user");
    return { success: true, message: "Task canceled successfully" };
  }

  async retryAutomation(userId: string, taskId: string) {
    const task = await this.taskService.getTask(userId, taskId);

    if (task.status !== AutomationStep.FAILED) {
      throw new BadRequestException("Only failed tasks can be retried.");
    }

    // Reset task status in database
    await this.taskService.updateTaskStatus(
      taskId,
      AutomationStep.QUEUED,
      0,
      "Queued for retry"
    );

    // Re-push to Queue
    await this.queueService.addJob("automation", "RetryAutomationJob", {
      taskId: task.id,
      applicationId: task.applicationId,
      userId,
      reviewBeforeSubmit: false,
    }, { jobId: task.id });

    await this.taskService.log(taskId, "INFO", AutomationStep.QUEUED, "Automation task queued for manual retry");
    return { success: true, message: "Task queued for retry successfully" };
  }
}
