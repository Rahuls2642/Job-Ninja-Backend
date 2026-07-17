import { Module } from "@nestjs/common";
import { AutomationController } from "./controllers/automation.controller";
import { AutomationService } from "./services/automation.service";
import { AutomationTaskService } from "./services/automation-task.service";
import { ProgressService } from "./services/progress.service";
import { ScreenshotService } from "./services/screenshot.service";
import { RetryService } from "./services/retry.service";
import { BrowserManager } from "./playwright/browser.manager";
import { ContextManager } from "./playwright/context.manager";
import { PageManager } from "./playwright/page.manager";
import { PlaywrightService } from "./playwright/playwright.service";
import { QueueService } from "./queue/queue.service";
import { QueueEventsListener } from "./queue/queue.events";
import { AutomationWorker } from "./workers/automation.worker";
import { ProviderFactory } from "./providers/provider.factory";
import { GreenhouseProvider } from "./providers/greenhouse/greenhouse.provider";
import { LeverProvider } from "./providers/lever/lever.provider";
import { AshbyProvider } from "./providers/ashby/ashby.provider";
import { WorkdayProvider } from "./providers/workday/workday.provider";
import { AiModule } from "../ai/ai.module";
import { StorageModule } from "../../common/storage/storage.module";

@Module({
  imports: [AiModule, StorageModule],
  controllers: [AutomationController],
  providers: [
    AutomationService,
    AutomationTaskService,
    ProgressService,
    ScreenshotService,
    RetryService,
    BrowserManager,
    ContextManager,
    PageManager,
    PlaywrightService,
    QueueService,
    QueueEventsListener,
    AutomationWorker,
    ProviderFactory,
    GreenhouseProvider,
    LeverProvider,
    AshbyProvider,
    WorkdayProvider,
  ],
  exports: [
    AutomationService,
    AutomationTaskService,
  ],
})
export class AutomationModule {}
