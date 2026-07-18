import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { QueueEvents } from "bullmq";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class QueueEventsListener implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueEventsListener.name);
  private queueEvents!: QueueEvents;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>("REDIS_URL");
    let connectionOption: any;
    if (redisUrl) {
      try {
        const parsed = new URL(redisUrl);
        connectionOption = {
          host: parsed.hostname,
          port: parseInt(parsed.port || "6379", 10),
          username: parsed.username || undefined,
          password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
          tls: parsed.protocol === "rediss:" ? {} : undefined,
        };
      } catch (e) {
        this.logger.error(`Failed to parse REDIS_URL: ${e.message}`);
        connectionOption = { host: "127.0.0.1", port: 6379 };
      }
    } else {
      connectionOption = {
        host: this.configService.get<string>("REDIS_HOST") || "127.0.0.1",
        port: parseInt(this.configService.get<string>("REDIS_PORT") || "6379", 10),
        password: this.configService.get<string>("REDIS_PASSWORD") || undefined,
      };
    }

    this.queueEvents = new QueueEvents("automation", {
      connection: connectionOption,
    });

    this.queueEvents.on("completed", ({ jobId }) => {
      this.logger.log(`Job ${jobId} completed successfully`);
    });

    this.queueEvents.on("failed", ({ jobId, failedReason }) => {
      this.logger.error(`Job ${jobId} failed. Reason: ${failedReason}`);
    });

    // Handle connection errors gracefully to prevent crashing
    this.queueEvents.on("error", (err) => {
      this.logger.error(`QueueEventsListener connection error: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    if (this.queueEvents) {
      await this.queueEvents.close();
    }
  }
}
