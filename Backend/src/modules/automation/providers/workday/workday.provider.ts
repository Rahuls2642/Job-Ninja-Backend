import { Injectable, Logger } from "@nestjs/common";
import { AutomationContext, AutomationProvider } from "../provider.interface";
import { workdaySelectors } from "./selectors";

@Injectable()
export class WorkdayProvider implements AutomationProvider {
  private readonly logger = new Logger(WorkdayProvider.name);

  supports(url: string): boolean {
    return url.includes("myworkdayjobs.com");
  }

  async prepare(context: AutomationContext): Promise<void> {
    await context.log("INFO", "STARTING", "Preparing Workday automation");
  }

  async execute(context: AutomationContext): Promise<void> {
    const { page, playwrightService, profile } = context;

    await context.log("INFO", "LAUNCH_BROWSER", "Page loaded. Filling Workday application details.");

    // Split name
    let firstName = "";
    let lastName = "";
    if (profile.fullName) {
      const parts = profile.fullName.trim().split(/\s+/);
      firstName = parts[0] || "";
      lastName = parts.slice(1).join(" ") || "Applicant";
    }

    try {
      const applyBtnExists = await page.$(workdaySelectors.applyButton);
      if (applyBtnExists) {
        await playwrightService.safeClick(page, workdaySelectors.applyButton);
      }
    } catch {
      // Button might not exist if navigated directly
    }

    try {
      await playwrightService.safeFill(page, workdaySelectors.firstName, firstName);
    } catch {
      await context.log("WARNING", "FILL_PROFILE", "Could not fill first name");
    }

    try {
      await playwrightService.safeFill(page, workdaySelectors.lastName, lastName);
    } catch {
      await context.log("WARNING", "FILL_PROFILE", "Could not fill last name");
    }

    try {
      await playwrightService.safeFill(page, workdaySelectors.email, profile.email || context.application.userEmail || "");
    } catch {
      await context.log("WARNING", "FILL_PROFILE", "Could not fill email");
    }

    try {
      await playwrightService.safeFill(page, workdaySelectors.phone, profile.phone || "");
    } catch {
      await context.log("WARNING", "FILL_PROFILE", "Could not fill phone");
    }
  }

  async submit(context: AutomationContext): Promise<void> {
    const { page, playwrightService } = context;
    await context.log("INFO", "SUBMITTING", "Submitting Workday application");
    try {
      const submitBtn = await page.$(workdaySelectors.submitButton);
      if (submitBtn) {
        await playwrightService.safeClick(page, workdaySelectors.submitButton);
      } else {
        await playwrightService.safeClick(page, workdaySelectors.nextButton);
      }
      await page.waitForNavigation({ waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
      await context.log("INFO", "COMPLETED", "Application submitted successfully!");
    } catch (err) {
      await context.log("ERROR", "FAILED", `Failed to submit application: ${err.message}`);
      throw err;
    }
  }
}
