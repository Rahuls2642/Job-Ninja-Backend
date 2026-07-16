import { pgTable, uuid, varchar, text, boolean, integer, timestamp, unique } from "drizzle-orm/pg-core";

export const jobs = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  externalId: varchar("external_id", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 100 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  companyLogo: text("company_logo"),
  title: varchar("title", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  remote: boolean("remote").default(false).notNull(),
  employmentType: varchar("employment_type", { length: 100 }),
  experienceLevel: varchar("experience_level", { length: 100 }),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  currency: varchar("currency", { length: 50 }),
  description: text("description"),
  requirements: text("requirements"),
  benefits: text("benefits"),
  applicationUrl: text("application_url"),
  sourceUrl: text("source_url"),
  postedAt: timestamp("posted_at"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return [
    unique("jobs_provider_external_id_key").on(table.provider, table.externalId)
  ];
});
