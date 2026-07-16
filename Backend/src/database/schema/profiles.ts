import {
    pgTable,
    uuid,
    varchar,
    integer,
    text,
    timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const profiles = pgTable("profiles", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .unique()
        .references(() => users.id, { onDelete: "cascade" }),
    fullName: varchar("full_name", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    country: varchar("country", { length: 100 }),
    city: varchar("city", { length: 100 }),
    headline: varchar("headline", { length: 255 }),
    yearsOfExperience: integer("years_of_experience"),
    currentJobTitle: varchar("current_job_title", { length: 255 }),
    preferredRole: varchar("preferred_role", { length: 255 }),
    preferredLocation: varchar("preferred_location", { length: 255 }),
    employmentType: varchar("employment_type", { length: 100 }),
    salaryExpectation: varchar("salary_expectation", { length: 255 }),
    bio: text("bio"),
    linkedinUrl: varchar("linkedin_url", { length: 500 }),
    githubUrl: varchar("github_url", { length: 500 }),
    portfolioUrl: varchar("portfolio_url", { length: 500 }),
    avatarUrl: varchar("avatar_url", { length: 500 }),
    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .notNull(),
});
