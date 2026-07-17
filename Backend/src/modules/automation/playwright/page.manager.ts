import { Injectable } from "@nestjs/common";
import { BrowserContext, Page } from "playwright";

@Injectable()
export class PageManager {
  async open(context: BrowserContext, url: string): Promise<Page> {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    return page;
  }

  async reload(page: Page): Promise<void> {
    await page.reload({ waitUntil: "domcontentloaded" });
  }

  async close(page: Page): Promise<void> {
    if (page) {
      await page.close();
    }
  }

  async back(page: Page): Promise<void> {
    await page.goBack({ waitUntil: "domcontentloaded" });
  }

  async forward(page: Page): Promise<void> {
    await page.goForward({ waitUntil: "domcontentloaded" });
  }
}
