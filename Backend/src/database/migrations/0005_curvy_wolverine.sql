CREATE TABLE "ai_job_analysis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"resume_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"overall_score" integer NOT NULL,
	"strengths" jsonb NOT NULL,
	"missing_skills" jsonb NOT NULL,
	"suggestions" jsonb NOT NULL,
	"summary" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_job_analysis_resume_id_job_id_key" UNIQUE("resume_id","job_id")
);
--> statement-breakpoint
ALTER TABLE "ai_job_analysis" ADD CONSTRAINT "ai_job_analysis_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_job_analysis" ADD CONSTRAINT "ai_job_analysis_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_job_analysis" ADD CONSTRAINT "ai_job_analysis_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;