import { pgTable, uuid, timestamp, unique } from "drizzle-orm/pg-core";
import { users } from "./users";
import { jobs } from "./jobs";

export const savedJobs = pgTable("saved_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  jobId: uuid("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return [
    unique("saved_jobs_user_id_job_id_key").on(table.userId, table.jobId)
  ];
});
