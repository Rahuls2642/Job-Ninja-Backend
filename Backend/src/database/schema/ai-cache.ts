import { pgTable, uuid, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { resumes } from "./resumes";
import { jobs } from "./jobs";

export const aiCache = pgTable("ai_cache", {
  id: uuid("id").defaultRandom().primaryKey(),
  resumeId: uuid("resume_id")
    .references(() => resumes.id, { onDelete: "cascade" }),
  jobId: uuid("job_id")
    .references(() => jobs.id, { onDelete: "cascade" }),
  hash: varchar("hash", { length: 255 }).notNull(),
  response: jsonb("response").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
