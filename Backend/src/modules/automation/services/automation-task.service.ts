import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { db } from "../../../database/drizzle";
import { automationTasks } from "../../../database/schema/automation-tasks";
import { automationLogs } from "../../../database/schema/automation-logs";
import { automationScreenshots } from "../../../database/schema/automation-screenshots";
import { eq, and, desc } from "drizzle-orm";
import { AutomationStep } from "../enums/automation-step.enum";

@Injectable()
export class AutomationTaskService {
  async createTask(userId: string, applicationId: string, provider: string, browser = "chromium") {
    const [task] = await db
      .insert(automationTasks)
      .values({
        userId,
        applicationId,
        provider,
        browser,
        status: AutomationStep.QUEUED,
        progress: 0,
        currentStep: "Queued",
      })
      .returning();

    await this.log(task.id, "INFO", AutomationStep.QUEUED, "Automation task queued successfully");
    return task;
  }

  async updateTaskStatus(
    taskId: string,
    status: AutomationStep,
    progress: number,
    currentStep: string,
    errorMessage?: string
  ) {
    const updateData: any = {
      status,
      progress,
      currentStep,
      updatedAt: new Date(),
    };

    if (status === AutomationStep.STARTING) {
      updateData.startedAt = new Date();
    } else if (status === AutomationStep.COMPLETED || status === AutomationStep.FAILED) {
      updateData.completedAt = new Date();
    }

    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }

    const [updated] = await db
      .update(automationTasks)
      .set(updateData)
      .where(eq(automationTasks.id, taskId))
      .returning();

    return updated;
  }

  async log(taskId: string, level: "INFO" | "WARNING" | "ERROR", step: string, message: string, screenshotUrl?: string) {
    const [logEntry] = await db
      .insert(automationLogs)
      .values({
        taskId,
        level,
        step,
        message,
        screenshotUrl,
      })
      .returning();

    return logEntry;
  }

  async saveScreenshot(taskId: string, step: string, fileUrl: string) {
    const [screenshot] = await db
      .insert(automationScreenshots)
      .values({
        taskId,
        step,
        fileUrl,
      })
      .returning();

    return screenshot;
  }

  async getTask(userId: string, taskId: string) {
    const [task] = await db
      .select()
      .from(automationTasks)
      .where(and(eq(automationTasks.id, taskId), eq(automationTasks.userId, userId)))
      .limit(1);

    if (!task) {
      throw new NotFoundException(`Automation task with ID ${taskId} not found`);
    }

    return task;
  }

  async getLogs(userId: string, taskId: string) {
    // Verify task exists and belongs to user
    await this.getTask(userId, taskId);

    return await db
      .select()
      .from(automationLogs)
      .where(eq(automationLogs.taskId, taskId))
      .orderBy(desc(automationLogs.createdAt));
  }

  async getScreenshots(userId: string, taskId: string) {
    // Verify task exists and belongs to user
    await this.getTask(userId, taskId);

    return await db
      .select()
      .from(automationScreenshots)
      .where(eq(automationScreenshots.taskId, taskId))
      .orderBy(desc(automationScreenshots.createdAt));
  }
}
