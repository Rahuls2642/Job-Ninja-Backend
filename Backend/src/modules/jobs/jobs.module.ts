import { Module } from "@nestjs/common";
import { JobsController } from "./controllers/jobs.controller";
import { JobsService } from "./services/jobs.service";
import { GreenhouseProvider } from "./providers/greenhouse.provider";
import { LeverProvider } from "./providers/lever.provider";
import { AshbyProvider } from "./providers/ashby.provider";
import { LinkedinProvider } from "./providers/linkedin.provider";
import { NaukriProvider } from "./providers/naukri.provider";
import { RemotiveProvider } from "./providers/remotive.provider";
import { TheMuseProvider } from "./providers/themuse.provider";
import { ArbeitnowProvider } from "./providers/arbeitnow.provider";
import { JobsScheduler } from "./schedulers/jobs.scheduler";

@Module({
  controllers: [JobsController],
  providers: [
    JobsService,
    GreenhouseProvider,
    LeverProvider,
    AshbyProvider,
    LinkedinProvider,
    NaukriProvider,
    RemotiveProvider,
    TheMuseProvider,
    ArbeitnowProvider,
    JobsScheduler,
  ],
  exports: [JobsService],
})
export class JobsModule {}
