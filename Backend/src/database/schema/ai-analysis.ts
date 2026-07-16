import { pgTable, uuid, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { resumes } from "./resumes";
import { jobs } from "./jobs";

export const aiAnalysis = pgTable("ai_analysis", {
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
  reasons: jsonb("reasons").notNull(), // list of strings
  missingSkills: jsonb("missing_skills").notNull(), // list of strings
  suggestions: jsonb("suggestions").notNull(), // list of strings
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
