CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" varchar(255),
	"phone" varchar(50),
	"country" varchar(100),
	"city" varchar(100),
	"headline" varchar(255),
	"years_of_experience" integer,
	"current_job_title" varchar(255),
	"preferred_role" varchar(255),
	"preferred_location" varchar(255),
	"employment_type" varchar(100),
	"salary_expectation" varchar(255),
	"bio" text,
	"linkedin_url" varchar(500),
	"github_url" varchar(500),
	"portfolio_url" varchar(500),
	"avatar_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;