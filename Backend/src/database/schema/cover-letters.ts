import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { resumes } from "./resumes";
import { jobs } from "./jobs";

export const coverLetters = pgTable("cover_letters", {
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
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
