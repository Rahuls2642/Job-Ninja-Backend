import { pgTable, uuid, varchar, integer, timestamp, text, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";
import { applications } from "./applications";

export const automationStatusEnum = pgEnum("automation_status", [
  "QUEUED",
  "STARTING",
  "LAUNCH_BROWSER",
  "OPEN_JOB",
  "UPLOAD_RESUME",
  "FILL_PROFILE",
  "FILL_CUSTOM_QUESTIONS",
  "UPLOAD_COVER_LETTER",
  "REVIEW",
  "WAITING_FOR_APPROVAL",
  "SUBMITTING",
  "COMPLETED",
  "FAILED"
]);

export const automationTasks = pgTable("automation_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 255 }).notNull(),
  browser: varchar("browser", { length: 100 }).default("chromium").notNull(),
  status: automationStatusEnum("status").default("QUEUED").notNull(),
  progress: integer("progress").default(0).notNull(),
  currentStep: varchar("current_step", { length: 255 }).default("Queued").notNull(),
  retryCount: integer("retry_count").default(0).notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
