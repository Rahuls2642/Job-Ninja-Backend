import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import { QueueEvents } from "bullmq";

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private queues: Map<string, Queue> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();
  private redisConnection: any;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>("REDIS_HOST") || "127.0.0.1";
    const port = parseInt(this.configService.get<string>("REDIS_PORT") || "6379", 10);
    const password = this.configService.get<string>("REDIS_PASSWORD") || undefined;

    this.redisConnection = { host, port, password };

    const queueNames = ["automation", "priority-automation", "retry-automation"];

    for (const name of queueNames) {
      const queue = new Queue(name, {
        connection: this.redisConnection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      });

      const events = new QueueEvents(name, {
        connection: this.redisConnection,
      });

      this.queues.set(name, queue);
      this.queueEvents.set(name, events);
      this.logger.log(`Initialized BullMQ queue: ${name}`);
    }
  }

  async addJob(queueName: string, jobName: string, data: any, opts?: any) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    return await queue.add(jobName, data, opts);
  }

  async getQueue(queueName: string): Promise<Queue | undefined> {
    return this.queues.get(queueName);
  }

  async cancelJob(queueName: string, jobId: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) {
      const job = await queue.getJob(jobId);
      if (job) {
        await job.remove();
      }
    }
  }

  async onModuleDestroy() {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    for (const events of this.queueEvents.values()) {
      await events.close();
    }
  }
}
