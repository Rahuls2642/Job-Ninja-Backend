import { Page, ElementHandle } from "playwright";

export class SelectorHelper {
  static async findElement(page: Page, selectors: string[]): Promise<ElementHandle | null> {
    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) return element;
      } catch (e) {
        // Suppress and try next fallback selector
      }
    }
    return null;
  }

  static async findByText(page: Page, text: string, tagName = "*"): Promise<ElementHandle | null> {
    try {
      const element = await page.$(`xpath=//${tagName}[contains(text(), '${text}')]`);
      return element;
    } catch {
      return null;
    }
  }
}
