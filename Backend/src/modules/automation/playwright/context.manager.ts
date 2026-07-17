import { Injectable } from "@nestjs/common";
import { Browser, BrowserContext } from "playwright";
import * as fs from "fs/promises";
import * as path from "path";

@Injectable()
export class ContextManager {
  async create(browser: Browser, options?: { viewport?: { width: number; height: number }; storageState?: string }): Promise<BrowserContext> {
    const contextOptions: any = {
      viewport: options?.viewport || { width: 1280, height: 800 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    if (options?.storageState) {
      try {
        // Try parsing as JSON first; if it's a string path, use as-is
        contextOptions.storageState = JSON.parse(options.storageState);
      } catch {
        contextOptions.storageState = options.storageState;
      }
    }

    return await browser.newContext(contextOptions);
  }

  async save(context: BrowserContext, filepath: string): Promise<void> {
    const dir = path.dirname(filepath);
    await fs.mkdir(dir, { recursive: true });
    await context.storageState({ path: filepath });
  }

  async restore(browser: Browser, filepath: string, options?: any): Promise<BrowserContext> {
    return this.create(browser, { ...options, storageState: filepath });
  }

  async destroy(context: BrowserContext): Promise<void> {
    if (context) {
      await context.close();
    }
  }
}
