import { Injectable } from "@nestjs/common";
import { AgentTool } from "./agent-tool.interface";
import { AutomationService } from "../../automation/services/automation.service";

@Injectable()
export class StartAutomationTool implements AgentTool {
  readonly name = "start_automation";

  constructor(private readonly automationService: AutomationService) {}

  async execute(input: { applicationId: string; reviewBeforeSubmit?: boolean }, context: { userId: string }) {
    const task = await this.automationService.startAutomation(context.userId, {
      applicationId: input.applicationId,
      reviewBeforeSubmit: input.reviewBeforeSubmit ?? false,
    });
    return {
      taskId: task.id,
      status: task.status,
    };
  }
}
