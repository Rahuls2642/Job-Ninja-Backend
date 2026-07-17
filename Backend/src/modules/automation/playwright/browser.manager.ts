import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { chromium, Browser } from "playwright";

@Injectable()
export class BrowserManager implements OnModuleDestroy {
  private browser: Browser | null = null;

  async launch(options?: { headless?: boolean; proxy?: { server: string; username?: string; password?: string } }): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    const headless = options?.headless !== false; // Default to headless true
    this.browser = await chromium.launch({
      headless,
      proxy: options?.proxy,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
    });

    return this.browser;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async restart(options?: { headless?: boolean; proxy?: { server: string; username?: string; password?: string } }): Promise<Browser> {
    await this.close();
    return this.launch(options);
  }

  async getBrowser(): Promise<Browser | null> {
    return this.browser;
  }

  async onModuleDestroy() {
    await this.close();
  }
}
