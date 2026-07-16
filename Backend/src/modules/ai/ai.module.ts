import { Module } from "@nestjs/common";
import { AiController } from "./controllers/ai.controller";
import { MatchScoreService } from "./services/match-score.service";
import { ResumeAnalyzerService } from "./services/resume-analyzer.service";
import { JobAnalyzerService } from "./services/job-analyzer.service";
import { SummaryService } from "./services/summary.service";
import { StorageModule } from "../../common/storage/storage.module";

@Module({
  imports: [StorageModule],
  controllers: [AiController],
  providers: [
    MatchScoreService,
    ResumeAnalyzerService,
    JobAnalyzerService,
    SummaryService,
  ],
  exports: [
    MatchScoreService,
    ResumeAnalyzerService,
    JobAnalyzerService,
    SummaryService,
  ],
})
export class AiModule {}
