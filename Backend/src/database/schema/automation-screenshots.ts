import { pgTable, uuid, varchar, timestamp, text } from "drizzle-orm/pg-core";
import { automationTasks } from "./automation-tasks";

export const automationScreenshots = pgTable("automation_screenshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => automationTasks.id, { onDelete: "cascade" }),
  step: varchar("step", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type AutomationScreenshot = typeof automationScreenshots.$inferSelect;
