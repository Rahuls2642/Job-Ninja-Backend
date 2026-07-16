import { pgTable, uuid, integer, text, jsonb, timestamp, unique } from "drizzle-orm/pg-core";
import { users } from "./users";
import { resumes } from "./resumes";
import { jobs } from "./jobs";

export const aiJobAnalysis = pgTable("ai_job_analysis", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  resumeId: uuid("resume_id")
    .notNull()
    .references(() => resumes.id, { onDelete: "cascade" }),
  jobId: uuid("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  overallScore: integer("overall_score").notNull(),
  strengths: jsonb("strengths").notNull(),
  missingSkills: jsonb("missing_skills").notNull(),
  suggestions: jsonb("suggestions").notNull(),
  summary: text("summary").notNull(), // Stores stringified JSON summary
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return [
    unique("ai_job_analysis_resume_id_job_id_key").on(table.resumeId, table.jobId)
  ];
});
