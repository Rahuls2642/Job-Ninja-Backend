import { Injectable, Logger } from "@nestjs/common";
import { AutomationContext, AutomationProvider } from "../provider.interface";
import { ashbySelectors } from "./selectors";

@Injectable()
export class AshbyProvider implements AutomationProvider {
  private readonly logger = new Logger(AshbyProvider.name);

  supports(url: string): boolean {
    return url.includes("ashbyhq.com");
  }

  async prepare(context: AutomationContext): Promise<void> {
    await context.log("INFO", "STARTING", "Preparing Ashby automation");
  }

  async execute(context: AutomationContext): Promise<void> {
    const { page, playwrightService, profile, resumePath } = context;

    await context.log("INFO", "LAUNCH_BROWSER", "Page loaded. Filling Ashby application details.");

    let firstName = "";
    let lastName = "";
    if (profile.fullName) {
      const parts = profile.fullName.trim().split(/\s+/);
      firstName = parts[0] || "";
      lastName = parts.slice(1).join(" ") || "Applicant";
    }

    try {
      await playwrightService.safeFill(page, ashbySelectors.firstName, firstName);
    } catch {
      await context.log("WARNING", "FILL_PROFILE", "Could not fill first name");
    }

    try {
      await playwrightService.safeFill(page, ashbySelectors.lastName, lastName);
    } catch {
      await context.log("WARNING", "FILL_PROFILE", "Could not fill last name");
    }

    try {
      await playwrightService.safeFill(page, ashbySelectors.email, profile.email || context.application.userEmail || "");
    } catch {
      await context.log("WARNING", "FILL_PROFILE", "Could not fill email");
    }

    try {
      await playwrightService.safeFill(page, ashbySelectors.phone, profile.phone || "");
    } catch {
      await context.log("WARNING", "FILL_PROFILE", "Could not fill phone");
    }

    if (resumePath) {
      await context.log("INFO", "UPLOAD_RESUME", "Uploading resume to Ashby");
      try {
        await playwrightService.safeUpload(page, ashbySelectors.resumeInput, resumePath);
        await context.log("INFO", "UPLOAD_RESUME", "Resume uploaded successfully");
      } catch (err) {
        await context.log("ERROR", "UPLOAD_RESUME", `Failed to upload resume: ${err.message}`);
        throw err;
      }
    }
  }

  async submit(context: AutomationContext): Promise<void> {
    const { page, playwrightService } = context;
    await context.log("INFO", "SUBMITTING", "Submitting Ashby application");
    try {
      await playwrightService.safeClick(page, ashbySelectors.submitButton);
      await page.waitForNavigation({ waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
      await context.log("INFO", "COMPLETED", "Application submitted successfully!");
    } catch (err) {
      await context.log("ERROR", "FAILED", `Failed to click submit button: ${err.message}`);
      throw err;
    }
  }
}
