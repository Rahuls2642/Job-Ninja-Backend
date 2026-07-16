CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" varchar(255) NOT NULL,
	"provider" varchar(100) NOT NULL,
	"company" varchar(255) NOT NULL,
	"company_logo" text,
	"title" varchar(255) NOT NULL,
	"location" varchar(255),
	"remote" boolean DEFAULT false NOT NULL,
	"employment_type" varchar(100),
	"experience_level" varchar(100),
	"salary_min" integer,
	"salary_max" integer,
	"currency" varchar(50),
	"description" text,
	"requirements" text,
	"benefits" text,
	"application_url" text,
	"source_url" text,
	"posted_at" timestamp,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "jobs_provider_external_id_key" UNIQUE("provider","external_id")
);
--> statement-breakpoint
CREATE TABLE "saved_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "saved_jobs_user_id_job_id_key" UNIQUE("user_id","job_id")
);
--> statement-breakpoint
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;