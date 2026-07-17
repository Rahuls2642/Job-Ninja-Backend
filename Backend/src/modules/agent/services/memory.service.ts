import { Injectable, NotFoundException } from "@nestjs/common";
import { db } from "../../../database/drizzle";
import { agentConversations } from "../../../database/schema/agent-conversations";
import { agentMessages } from "../../../database/schema/agent-messages";
import { agentTasks } from "../../../database/schema/agent-tasks";
import { eq, and, desc } from "drizzle-orm";

@Injectable()
export class MemoryService {
  async createConversation(userId: string, title: string) {
    const [conv] = await db
      .insert(agentConversations)
      .values({ userId, title })
      .returning();
    return conv;
  }

  async getConversations(userId: string) {
    return await db
      .select()
      .from(agentConversations)
      .where(eq(agentConversations.userId, userId))
      .orderBy(desc(agentConversations.createdAt));
  }

  async getConversationHistory(userId: string, conversationId: string) {
    // Verify ownership
    const [conv] = await db
      .select()
      .from(agentConversations)
      .where(and(eq(agentConversations.id, conversationId), eq(agentConversations.userId, userId)))
      .limit(1);

    if (!conv) {
      throw new NotFoundException("Conversation not found");
    }

    return await db
      .select()
      .from(agentMessages)
      .where(eq(agentMessages.conversationId, conversationId))
      .orderBy(agentMessages.createdAt);
  }

  async addMessage(conversationId: string, role: "user" | "assistant" | "system", content: string) {
    const [msg] = await db
      .insert(agentMessages)
      .values({ conversationId, role, content })
      .returning();
    return msg;
  }

  async createTask(conversationId: string, taskType: string, executionPlan: any) {
    const [task] = await db
      .insert(agentTasks)
      .values({
        conversationId,
        taskType,
        status: "QUEUED",
        executionPlan,
        currentStep: 0,
      })
      .returning();
    return task;
  }

  async updateTaskStep(taskId: string, currentStep: number, result?: any) {
    await db
      .update(agentTasks)
      .set({
        currentStep,
        result,
        status: "RUNNING",
        updatedAt: new Date(),
      })
      .where(eq(agentTasks.id, taskId));
  }

  async updateTaskStatus(taskId: string, status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELED", result?: any) {
    await db
      .update(agentTasks)
      .set({
        status,
        result,
        updatedAt: new Date(),
      })
      .where(eq(agentTasks.id, taskId));
  }

  async getTask(taskId: string) {
    const [task] = await db
      .select()
      .from(agentTasks)
      .where(eq(agentTasks.id, taskId))
      .limit(1);

    if (!task) {
      throw new NotFoundException("Agent task not found");
    }
    return task;
  }
}
