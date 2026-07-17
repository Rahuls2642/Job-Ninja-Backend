import { Injectable, Logger } from "@nestjs/common";
import { Page } from "playwright";

@Injectable()
export class PlaywrightService {
  private readonly logger = new Logger(PlaywrightService.name);

  async goto(page: Page, url: string, timeout = 30000): Promise<void> {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout });
  }

  async safeClick(page: Page, selector: string, timeout = 10000): Promise<void> {
    try {
      await page.waitForSelector(selector, { state: "visible", timeout });
      await page.click(selector);
    } catch (error) {
      this.logger.warn(`Failed to click selector: ${selector}. Error: ${error.message}`);
      throw error;
    }
  }

  async safeFill(page: Page, selector: string, value: string, timeout = 10000): Promise<void> {
    try {
      await page.waitForSelector(selector, { state: "visible", timeout });
      await page.fill(selector, value);
    } catch (error) {
      this.logger.warn(`Failed to fill selector: ${selector}. Error: ${error.message}`);
      throw error;
    }
  }

  async safeSelect(page: Page, selector: string, optionValue: string, timeout = 10000): Promise<void> {
    try {
      await page.waitForSelector(selector, { state: "visible", timeout });
      await page.selectOption(selector, optionValue);
    } catch (error) {
      this.logger.warn(`Failed to select option for: ${selector}. Error: ${error.message}`);
      throw error;
    }
  }

  async safeUpload(page: Page, selector: string, filePath: string, timeout = 10000): Promise<void> {
    try {
      await page.waitForSelector(selector, { state: "attached", timeout });
      const input = await page.$(selector);
      if (input) {
        await input.setInputFiles(filePath);
      } else {
        throw new Error(`Element ${selector} not found for upload.`);
      }
    } catch (error) {
      this.logger.warn(`Failed to upload file for: ${selector}. Error: ${error.message}`);
      throw error;
    }
  }

  async safeCheckbox(page: Page, selector: string, check = true, timeout = 10000): Promise<void> {
    try {
      await page.waitForSelector(selector, { state: "visible", timeout });
      if (check) {
        await page.check(selector);
      } else {
        await page.uncheck(selector);
      }
    } catch (error) {
      this.logger.warn(`Failed to set checkbox: ${selector}. Error: ${error.message}`);
      throw error;
    }
  }

  async safeRadio(page: Page, selector: string, check = true, timeout = 10000): Promise<void> {
    try {
      await page.waitForSelector(selector, { state: "visible", timeout });
      if (check) {
        await page.check(selector);
      }
    } catch (error) {
      this.logger.warn(`Failed to select radio: ${selector}. Error: ${error.message}`);
      throw error;
    }
  }

  async safeScroll(page: Page, selector?: string): Promise<void> {
    if (selector) {
      const element = await page.$(selector);
      if (element) {
        await element.scrollIntoViewIfNeeded();
      }
    } else {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    }
  }

  async waitFor(page: Page, selector: string, state: "attached" | "detached" | "visible" | "hidden" = "visible", timeout = 10000): Promise<void> {
    await page.waitForSelector(selector, { state, timeout });
  }

  async waitForNavigation(page: Page, timeout = 30000): Promise<void> {
    await page.waitForNavigation({ waitUntil: "networkidle", timeout });
  }

  async takeScreenshot(page: Page, path: string): Promise<void> {
    await page.screenshot({ path, fullPage: true });
  }

  async retry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
    let lastError: any;
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  }
}
