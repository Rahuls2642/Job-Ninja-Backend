import { Injectable, Logger } from "@nestjs/common";
import { AutomationContext, AutomationProvider } from "../provider.interface";
import { leverSelectors } from "./selectors";

@Injectable()
export class LeverProvider implements AutomationProvider {
  private readonly logger = new Logger(LeverProvider.name);

  supports(url: string): boolean {
    return url.includes("lever.co");
  }

  async prepare(context: AutomationContext): Promise<void> {
    await context.log("INFO", "STARTING", "Preparing Lever automation");
  }

  async execute(context: AutomationContext): Promise<void> {
    const { page, playwrightService, profile, resumePath } = context;

    await context.log("INFO", "LAUNCH_BROWSER", "Page loaded. Filling Lever application details.");

    // Fill Full Name
    try {
      await playwrightService.safeFill(page, leverSelectors.fullName, profile.fullName || "");
    } catch {
      await context.log("WARNING", "FILL_PROFILE", "Could not fill full name");
    }

    // Fill Email
    try {
      await playwrightService.safeFill(page, leverSelectors.email, profile.email || context.application.userEmail || "");
    } catch {
      await context.log("WARNING", "FILL_PROFILE", "Could not fill email");
    }

    // Fill Phone
    try {
      await playwrightService.safeFill(page, leverSelectors.phone, profile.phone || "");
    } catch {
      await context.log("WARNING", "FILL_PROFILE", "Could not fill phone");
    }

    // Fill Org (Company)
    try {
      await playwrightService.safeFill(page, leverSelectors.org, profile.currentJobTitle || "");
    } catch {
      // Optional field
    }

    // Upload Resume
    if (resumePath) {
      await context.log("INFO", "UPLOAD_RESUME", "Uploading resume to Lever");
      try {
        await playwrightService.safeUpload(page, leverSelectors.resumeInput, resumePath);
        await context.log("INFO", "UPLOAD_RESUME", "Resume uploaded successfully");
      } catch (err) {
        await context.log("ERROR", "UPLOAD_RESUME", `Failed to upload resume: ${err.message}`);
        throw err;
      }
    }
  }

  async submit(context: AutomationContext): Promise<void> {
    const { page, playwrightService } = context;
    await context.log("INFO", "SUBMITTING", "Submitting Lever application");
    try {
      await playwrightService.safeClick(page, leverSelectors.submitButton);
      await page.waitForNavigation({ waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
      await context.log("INFO", "COMPLETED", "Application submitted successfully!");
    } catch (err) {
      await context.log("ERROR", "FAILED", `Failed to click submit button: ${err.message}`);
      throw err;
    }
  }
}
