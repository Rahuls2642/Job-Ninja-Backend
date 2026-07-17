CREATE TYPE "public"."log_level" AS ENUM('INFO', 'WARNING', 'ERROR');--> statement-breakpoint
CREATE TYPE "public"."automation_status" AS ENUM('QUEUED', 'STARTING', 'LAUNCH_BROWSER', 'OPEN_JOB', 'UPLOAD_RESUME', 'FILL_PROFILE', 'FILL_CUSTOM_QUESTIONS', 'UPLOAD_COVER_LETTER', 'REVIEW', 'WAITING_FOR_APPROVAL', 'SUBMITTING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TABLE "automation_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"level" "log_level" DEFAULT 'INFO' NOT NULL,
	"step" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"screenshot_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automation_screenshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"step" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automation_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(255) NOT NULL,
	"browser" varchar(100) DEFAULT 'chromium' NOT NULL,
	"status" "automation_status" DEFAULT 'QUEUED' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"current_step" varchar(255) DEFAULT 'Queued' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "automation_logs" ADD CONSTRAINT "automation_logs_task_id_automation_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."automation_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_screenshots" ADD CONSTRAINT "automation_screenshots_task_id_automation_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."automation_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_tasks" ADD CONSTRAINT "automation_tasks_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_tasks" ADD CONSTRAINT "automation_tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;