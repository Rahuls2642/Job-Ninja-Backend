import { Injectable } from "@nestjs/common";
import { AgentTool } from "./agent-tool.interface";
import { AIOrchestratorService } from "../../ai/services/ai-orchestrator.service";

@Injectable()
export class TailorResumeTool implements AgentTool {
  readonly name = "tailor_resume";

  constructor(private readonly aiOrchestrator: AIOrchestratorService) {}

  async execute(input: { jobId: string; resumeId: string }, context: { userId: string }) {
    const result = await this.aiOrchestrator.tailorResume(context.userId, input.resumeId, input.jobId);
    return {
      jobId: input.jobId,
      tailoredResumeId: result.tailoredResumeId || result.id || null,
      message: "Resume tailored successfully",
    };
  }
}
