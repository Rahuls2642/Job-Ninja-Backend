import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { applications } from "./applications";

export const applicationTimeline = pgTable("application_timeline", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  eventType: varchar("event_type", { length: 255 }).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
