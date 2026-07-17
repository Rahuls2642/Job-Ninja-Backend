import { Injectable, Logger } from "@nestjs/common";
import { AIOrchestratorService } from "../../ai/services/ai-orchestrator.service";
import { plannerSystemPrompt } from "../prompts/planner.prompt";

@Injectable()
export class PlannerService {
  private readonly logger = new Logger(PlannerService.name);

  constructor(private readonly aiOrchestrator: AIOrchestratorService) {}

  async generatePlan(userMessage: string, history: any[]): Promise<{ steps: Array<{ type: string; params: any }> }> {
    const historyText = history
      .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`)
      .join("\n");

    const userPrompt = `Conversation History:\n${historyText}\n\nLatest Request: "${userMessage}"`;

    try {
      const result = await this.aiOrchestrator.queryAgent(plannerSystemPrompt, userPrompt, () => {
        return this.generateFallbackPlan(userMessage);
      });

      if (result && Array.isArray(result.steps)) {
        return result;
      }
      return this.generateFallbackPlan(userMessage);
    } catch (e) {
      this.logger.warn(`Failed to generate plan via LLM: ${e.message}. Using fallback.`);
      return this.generateFallbackPlan(userMessage);
    }
  }

  private generateFallbackPlan(message: string): { steps: Array<{ type: string; params: any }> } {
    const cleanMsg = message.toLowerCase();
    const steps: Array<{ type: string; params: any }> = [];

    // Parse simple keywords
    let keyword = "React";
    if (cleanMsg.includes("react")) keyword = "React";
    else if (cleanMsg.includes("node")) keyword = "Node";
    else if (cleanMsg.includes("typescript")) keyword = "TypeScript";
    else if (cleanMsg.includes("frontend")) keyword = "Frontend";

    let location = "Berlin";
    if (cleanMsg.includes("berlin")) location = "Berlin";
    else if (cleanMsg.includes("munich")) location = "Munich";
    else if (cleanMsg.includes("germany")) location = "Germany";
    else if (cleanMsg.includes("remote")) location = "Remote";

    // 1. Search jobs
    steps.push({
      type: "search_jobs",
      params: { keyword, location, remote: cleanMsg.includes("remote") },
    });

    // 2. Score job
    steps.push({
      type: "score_job",
      params: {},
    });

    // 3. Tailor resume
    steps.push({
      type: "tailor_resume",
      params: {},
    });

    // 4. Generate cover letter
    steps.push({
      type: "generate_cover_letter",
      params: {},
    });

    // 5. Create application
    steps.push({
      type: "create_application",
      params: {},
    });

    // 6. Start automation
    steps.push({
      type: "start_automation",
      params: { reviewBeforeSubmit: cleanMsg.includes("review") || cleanMsg.includes("pause") },
    });

    return { steps };
  }
}
