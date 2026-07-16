import { Module } from "@nestjs/common";
import { JobsController } from "./controllers/jobs.controller";
import { JobsService } from "./services/jobs.service";
import { GreenhouseProvider } from "./providers/greenhouse.provider";
import { LeverProvider } from "./providers/lever.provider";
import { AshbyProvider } from "./providers/ashby.provider";
import { JobsScheduler } from "./schedulers/jobs.scheduler";

@Module({
  controllers: [JobsController],
  providers: [
    JobsService,
    GreenhouseProvider,
    LeverProvider,
    AshbyProvider,
    JobsScheduler,
  ],
  exports: [JobsService],
})
export class JobsModule {}
