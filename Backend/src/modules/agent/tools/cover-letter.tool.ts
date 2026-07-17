import { Injectable } from "@nestjs/common";
import { AgentTool } from "./agent-tool.interface";
import { AIOrchestratorService } from "../../ai/services/ai-orchestrator.service";

@Injectable()
export class GenerateCoverLetterTool implements AgentTool {
  readonly name = "generate_cover_letter";

  constructor(private readonly aiOrchestrator: AIOrchestratorService) {}

  async execute(input: { jobId: string; resumeId: string }, context: { userId: string }) {
    const result = await this.aiOrchestrator.coverLetter(context.userId, input.jobId, input.resumeId);
    return {
      jobId: input.jobId,
      coverLetterId: result.coverLetterId || result.id || null,
      message: "Cover letter generated successfully",
    };
  }
}
