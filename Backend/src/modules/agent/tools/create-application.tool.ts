import { Injectable } from "@nestjs/common";
import { AgentTool } from "./agent-tool.interface";
import { ApplicationsService } from "../../applications/services/applications.service";

@Injectable()
export class CreateApplicationTool implements AgentTool {
  readonly name = "create_application";

  constructor(private readonly applicationsService: ApplicationsService) {}

  async execute(input: { jobId: string; resumeId: string }, context: { userId: string }) {
    const app = await this.applicationsService.create(context.userId, {
      jobId: input.jobId,
      resumeId: input.resumeId,
    });
    return {
      applicationId: app.id,
      jobId: input.jobId,
      status: app.status,
    };
  }
}
