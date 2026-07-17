import { Module } from "@nestjs/common";
import { AgentController } from "./controllers/agent.controller";
import { AgentService } from "./services/agent.service";
import { PlannerService } from "./services/planner.service";
import { ExecutorService } from "./services/executor.service";
import { MemoryService } from "./services/memory.service";
import { ValidationService } from "./services/validation.service";
import { SearchJobsTool } from "./tools/search-jobs.tool";
import { ScoreJobTool } from "./tools/score-job.tool";
import { TailorResumeTool } from "./tools/tailor-resume.tool";
import { GenerateCoverLetterTool } from "./tools/cover-letter.tool";
import { CreateApplicationTool } from "./tools/create-application.tool";
import { StartAutomationTool } from "./tools/start-automation.tool";
import { JobsModule } from "../jobs/jobs.module";
import { AiModule } from "../ai/ai.module";
import { ResumeModule } from "../resume/resume.module";
import { ApplicationsModule } from "../applications/applications.module";
import { AutomationModule } from "../automation/automation.module";

@Module({
  imports: [
    JobsModule,
    AiModule,
    ResumeModule,
    ApplicationsModule,
    AutomationModule,
  ],
  controllers: [AgentController],
  providers: [
    AgentService,
    PlannerService,
    ExecutorService,
    MemoryService,
    ValidationService,
    SearchJobsTool,
    ScoreJobTool,
    TailorResumeTool,
    GenerateCoverLetterTool,
    CreateApplicationTool,
    StartAutomationTool,
  ],
  exports: [
    AgentService,
    MemoryService,
  ],
})
export class AgentModule {}
