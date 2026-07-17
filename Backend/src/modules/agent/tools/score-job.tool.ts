import { Injectable } from "@nestjs/common";
import { AgentTool } from "./agent-tool.interface";
import { AIOrchestratorService } from "../../ai/services/ai-orchestrator.service";

@Injectable()
export class ScoreJobTool implements AgentTool {
  readonly name = "score_job";

  constructor(private readonly aiOrchestrator: AIOrchestratorService) {}

  async execute(input: { jobId: string; resumeId: string }, context: { userId: string }) {
    const analysis = await this.aiOrchestrator.scoreJob(context.userId, input.jobId, input.resumeId);
    return {
      jobId: input.jobId,
      overallScore: analysis.overallScore,
    };
  }
}
