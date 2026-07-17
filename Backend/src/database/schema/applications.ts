import { pgTable, uuid, text, timestamp, pgEnum, unique } from "drizzle-orm/pg-core";
import { users } from "./users";
import { resumes } from "./resumes";
import { jobs } from "./jobs";
import { coverLetters } from "./cover-letters";
import { aiAnalysis } from "./ai-analysis";

export const applicationStatusEnum = pgEnum("application_status", [
  "DRAFT",
  "READY",
  "SUBMITTED",
  "UNDER_REVIEW",
  "INTERVIEW",
  "ASSESSMENT",
  "FINAL_INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
  "WITHDRAWN",
]);

export const applications = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  jobId: uuid("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  resumeId: uuid("resume_id")
    .notNull()
    .references(() => resumes.id, { onDelete: "cascade" }),
  coverLetterId: uuid("cover_letter_id")
    .references(() => coverLetters.id, { onDelete: "set null" }),
  aiAnalysisId: uuid("ai_analysis_id")
    .references(() => aiAnalysis.id, { onDelete: "set null" }),
  status: applicationStatusEnum("status").default("DRAFT").notNull(),
  notes: text("notes"),
  appliedAt: timestamp("applied_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return [
    unique("applications_user_id_job_id_key").on(table.userId, table.jobId)
  ];
});
