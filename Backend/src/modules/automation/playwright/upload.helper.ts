import { Page } from "playwright";

export class UploadHelper {
  static async uploadFile(page: Page, selector: string, filePath: string): Promise<void> {
    const fileInput = await page.waitForSelector(selector, { state: "attached", timeout: 10000 });
    await fileInput.setInputFiles(filePath);
  }
}
