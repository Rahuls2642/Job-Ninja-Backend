import { Page } from "playwright";

export class NavigationHelper {
  static async safeGoto(page: Page, url: string, timeout = 30000): Promise<void> {
    await page.goto(url, { waitUntil: "networkidle", timeout });
  }

  static async scrollToBottom(page: Page): Promise<void> {
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
  }

  static async scrollToElement(page: Page, selector: string): Promise<void> {
    const element = await page.$(selector);
    if (element) {
      await element.scrollIntoViewIfNeeded();
    }
  }
}
