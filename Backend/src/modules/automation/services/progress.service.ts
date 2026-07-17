import { Injectable } from "@nestjs/common";
import { AutomationStep } from "../enums/automation-step.enum";
import { AutomationTaskService } from "./automation-task.service";

@Injectable()
export class ProgressService {
  constructor(private readonly taskService: AutomationTaskService) {}

  private getProgressPercentage(step: AutomationStep): number {
    switch (step) {
      case AutomationStep.QUEUED:
        return 0;
      case AutomationStep.STARTING:
        return 5;
      case AutomationStep.LAUNCH_BROWSER:
        return 10;
      case AutomationStep.OPEN_JOB:
        return 25;
      case AutomationStep.UPLOAD_RESUME:
        return 45;
      case AutomationStep.FILL_PROFILE:
        return 60;
      case AutomationStep.FILL_CUSTOM_QUESTIONS:
        return 75;
      case AutomationStep.UPLOAD_COVER_LETTER:
        return 85;
      case AutomationStep.REVIEW:
        return 90;
      case AutomationStep.WAITING_FOR_APPROVAL:
        return 95;
      case AutomationStep.SUBMITTING:
        return 98;
      case AutomationStep.COMPLETED:
        return 100;
      case AutomationStep.FAILED:
        return 100;
      default:
        return 0;
    }
  }

  async updateStep(taskId: string, step: AutomationStep, currentStepText: string, errorMessage?: string) {
    const progress = this.getProgressPercentage(step);
    return await this.taskService.updateTaskStatus(taskId, step, progress, currentStepText, errorMessage);
  }
}
