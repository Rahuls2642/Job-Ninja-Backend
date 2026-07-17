import { pgTable, uuid, varchar, timestamp, text, pgEnum } from "drizzle-orm/pg-core";
import { automationTasks } from "./automation-tasks";

export const logLevelEnum = pgEnum("log_level", [
  "INFO",
  "WARNING",
  "ERROR"
]);

export const automationLogs = pgTable("automation_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => automationTasks.id, { onDelete: "cascade" }),
  level: logLevelEnum("level").default("INFO").notNull(),
  step: varchar("step", { length: 255 }).notNull(),
  message: text("message").notNull(),
  screenshotUrl: text("screenshot_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
