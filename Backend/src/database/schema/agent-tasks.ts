import { pgTable, uuid, varchar, integer, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { agentConversations } from "./agent-conversations";

export const taskStatusEnum = pgEnum("task_status", [
  "QUEUED",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "CANCELED"
]);

export const agentTasks = pgTable("agent_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => agentConversations.id, { onDelete: "cascade" }),
  taskType: varchar("task_type", { length: 100 }).notNull(),
  status: taskStatusEnum("status").default("QUEUED").notNull(),
  executionPlan: jsonb("execution_plan").notNull(),
  currentStep: integer("current_step").default(0).notNull(),
  result: jsonb("result"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type AgentTask = typeof agentTasks.$inferSelect;
