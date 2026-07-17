import { Injectable, BadRequestException } from "@nestjs/common";
import { MemoryService } from "./memory.service";
import { PlannerService } from "./planner.service";
import { ExecutorService } from "./executor.service";
import { db } from "../../../database/drizzle";
import { agentTasks } from "../../../database/schema/agent-tasks";
import { eq } from "drizzle-orm";

@Injectable()
export class AgentService {
  constructor(
    private readonly memoryService: MemoryService,
    private readonly plannerService: PlannerService,
    private readonly executorService: ExecutorService,
  ) {}

  async handleChatMessage(userId: string, message: string, conversationId?: string) {
    let convId = conversationId;
    if (!convId) {
      const conv = await this.memoryService.createConversation(userId, `Chat: ${message.slice(0, 30)}...`);
      convId = conv.id;
    }

    // 1. Save user message
    await this.memoryService.addMessage(convId, "user", message);

    // 2. Fetch history
    const history = await this.memoryService.getConversationHistory(userId, convId);

    // 3. Generate execution plan
    const plan = await this.plannerService.generatePlan(message, history);

    // 4. Create Task
    const task = await this.memoryService.createTask(convId, "apply_workflow", plan);

    // 5. Save assistant reply acknowledging the plan
    const replyText = `I have parsed your request and scheduled a workflow with task ID: ${task.id}. Here is the plan I created:\n${plan.steps.map((s, idx) => `${idx + 1}. ${s.type} (${JSON.stringify(s.params)})`).join("\n")}`;
    await this.memoryService.addMessage(convId, "assistant", replyText);

    // 6. Run Executor Asynchronously
    // Note: Do not await this so the API responds instantly.
    this.executorService.executePlan(task.id, userId).catch((err) => {
      console.error(`Async plan execution failed: ${err.message}`);
    });

    return {
      conversationId: convId,
      taskId: task.id,
      reply: replyText,
    };
  }

  async cancelTask(userId: string, taskId: string) {
    const task = await this.memoryService.getTask(taskId);
    if (task.status === "COMPLETED" || task.status === "FAILED") {
      throw new BadRequestException("Task has already finished.");
    }

    await this.memoryService.updateTaskStatus(taskId, "CANCELED", { message: "Canceled by user" });
    return { success: true, message: "Workflow task canceled successfully" };
  }
}
