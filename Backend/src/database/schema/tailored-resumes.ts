import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { resumes } from "./resumes";
import { jobs } from "./jobs";

export const tailoredResumes = pgTable("tailored_resumes", {
  id: uuid("id").defaultRandom().primaryKey(),
  resumeId: uuid("resume_id")
    .notNull()
    .references(() => resumes.id, { onDelete: "cascade" }),
  jobId: uuid("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
