import { pgTable, uuid, timestamp, text, pgEnum } from "drizzle-orm/pg-core";
import { agentConversations } from "./agent-conversations";

export const agentRoleEnum = pgEnum("agent_role", ["user", "assistant", "system"]);

export const agentMessages = pgTable("agent_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => agentConversations.id, { onDelete: "cascade" }),
  role: agentRoleEnum("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type AgentMessage = typeof agentMessages.$inferSelect;
