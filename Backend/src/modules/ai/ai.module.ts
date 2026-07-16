import { Module } from "@nestjs/common";
import { AiController } from "./controllers/ai.controller";
import { AIOrchestratorService } from "./services/ai-orchestrator.service";
import { ResumeAnalyzerService } from "./services/resume-analyzer.service";
import { JobAnalyzerService } from "./services/job-analyzer.service";
import { ATSScoreService } from "./services/ats.service";
import { ResumeTailorService } from "./services/tailor-resume.service";
import { CoverLetterService } from "./services/cover-letter.service";
import { JobSummaryService } from "./services/job-summary.service";
import { JobScoreService } from "./services/job-score.service";
import { AiCacheService } from "./services/cache.service";
import { StorageModule } from "../../common/storage/storage.module";

@Module({
  imports: [StorageModule],
  controllers: [AiController],
  providers: [
    AIOrchestratorService,
    ResumeAnalyzerService,
    JobAnalyzerService,
    ATSScoreService,
    ResumeTailorService,
    CoverLetterService,
    JobSummaryService,
    JobScoreService,
    AiCacheService,
  ],
  exports: [
    AIOrchestratorService,
    ResumeAnalyzerService,
    JobAnalyzerService,
    ATSScoreService,
    ResumeTailorService,
    CoverLetterService,
    JobSummaryService,
    JobScoreService,
    AiCacheService,
  ],
})
export class AiModule {}
