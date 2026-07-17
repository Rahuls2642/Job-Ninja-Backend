import { Injectable, Inject, Logger } from "@nestjs/common";
import { Page } from "playwright";
import { StorageProvider } from "../../../common/storage/storage.interface";
import { AutomationTaskService } from "./automation-task.service";
import * as fs from "fs/promises";
import * as path from "path";

@Injectable()
export class ScreenshotService {
  private readonly logger = new Logger(ScreenshotService.name);

  constructor(
    @Inject("StorageProvider")
    private readonly storageProvider: StorageProvider,
    private readonly taskService: AutomationTaskService,
  ) {}

  async captureAndUpload(page: Page, taskId: string, step: string): Promise<string> {
    const localDir = path.join(process.cwd(), "uploads", "screenshots", taskId);
    await fs.mkdir(localDir, { recursive: true });
    const localPath = path.join(localDir, `${step.toLowerCase().replace(/[^a-z0-9]/g, "-")}.png`);

    try {
      await page.screenshot({ path: localPath, fullPage: true });

      const fileBuffer = await fs.readFile(localPath);
      const multerFile: any = {
        fieldname: "file",
        originalname: `${step}.png`,
        encoding: "7bit",
        mimetype: "image/png",
        buffer: fileBuffer,
        size: fileBuffer.length,
      };

      const storageKey = `screenshots/${taskId}/${step}.png`;
      const fileUrl = await this.storageProvider.upload(multerFile, storageKey);

      await this.taskService.saveScreenshot(taskId, step, fileUrl);
      this.logger.log(`Screenshot saved for task ${taskId} at step ${step}: ${fileUrl}`);

      // Cleanup local file
      await fs.unlink(localPath).catch(() => {});

      return fileUrl;
    } catch (error) {
      this.logger.error(`Failed to capture and upload screenshot: ${error.message}`);
      return "";
    }
  }
}
