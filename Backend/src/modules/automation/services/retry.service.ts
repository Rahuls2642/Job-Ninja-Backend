import { Injectable } from "@nestjs/common";
import { db } from "../../../database/drizzle";
import { automationTasks } from "../../../database/schema/automation-tasks";
import { eq, sql } from "drizzle-orm";

@Injectable()
export class RetryService {
  private readonly maxRetries = 3;

  isTransient(error: Error): boolean {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("timeout") ||
      msg.includes("navigation failed") ||
      msg.includes("network") ||
      msg.includes("crash") ||
      msg.includes("detached") ||
      msg.includes("target closed") ||
      msg.includes("browser has been closed")
    );
  }

  async shouldRetry(taskId: string, error: Error): Promise<boolean> {
    if (!this.isTransient(error)) {
      return false;
    }

    const [task] = await db
      .select({ retryCount: automationTasks.retryCount })
      .from(automationTasks)
      .where(eq(automationTasks.id, taskId))
      .limit(1);

    return task ? task.retryCount < this.maxRetries : false;
  }

  async incrementRetry(taskId: string): Promise<number> {
    const [updated] = await db
      .update(automationTasks)
      .set({
        retryCount: sql`${automationTasks.retryCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(automationTasks.id, taskId))
      .returning();

    return updated ? updated.retryCount : 0;
  }
}
