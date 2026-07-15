import {
    pgTable,
    uuid,
    varchar,
    timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),

    fullName: varchar("full_name", { length: 255 }).notNull(),

    email: varchar("email", { length: 255 })
        .notNull()
        .unique(),

    password: varchar("password", { length: 255 }).notNull(),

    avatarUrl: varchar("avatar_url", { length: 500 }),
    linkedinUrl: varchar("linkedin_url", { length: 500 }),
    githubUrl: varchar("github_url", { length: 500 }),
    portfolioUrl: varchar("portfolio_url", { length: 500 }),
    location: varchar("location", { length: 255 }),
    experience: varchar("experience", { length: 255 }),
    preferredRole: varchar("preferred_role", { length: 255 }),
    salaryExpectation: varchar("salary_expectation", { length: 255 }),
    refreshToken: varchar("refresh_token", { length: 500 }),

    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),

    updatedAt: timestamp("updated_at")
        .defaultNow()
        .notNull(),
});