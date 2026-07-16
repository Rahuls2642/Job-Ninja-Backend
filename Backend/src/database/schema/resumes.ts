import {
    pgTable,
    uuid,
    varchar,
    integer,
    text,
    boolean,
    timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const resumes = pgTable("resumes", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 100 }).notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileKey: varchar("file_key", { length: 255 }).notNull(),
    fileUrl: text("file_url").notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    fileSize: integer("file_size").notNull(),
    version: integer("version").default(1).notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .notNull(),
});
