import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { QueueEvents } from "bullmq";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class QueueEventsListener implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueEventsListener.name);
  private queueEvents!: QueueEvents;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>("REDIS_HOST") || "127.0.0.1";
    const port = parseInt(this.configService.get<string>("REDIS_PORT") || "6379", 10);
    const password = this.configService.get<string>("REDIS_PASSWORD") || undefined;

    this.queueEvents = new QueueEvents("automation", {
      connection: { host, port, password },
    });

    this.queueEvents.on("completed", ({ jobId }) => {
      this.logger.log(`Job ${jobId} completed successfully`);
    });

    this.queueEvents.on("failed", ({ jobId, failedReason }) => {
      this.logger.error(`Job ${jobId} failed. Reason: ${failedReason}`);
    });
  }

  async onModuleDestroy() {
    if (this.queueEvents) {
      await this.queueEvents.close();
    }
  }
}
