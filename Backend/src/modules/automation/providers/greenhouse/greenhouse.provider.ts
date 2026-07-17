import { Injectable, Logger } from "@nestjs/common";
import { AutomationContext, AutomationProvider } from "../provider.interface";
import { greenhouseSelectors } from "./selectors";

@Injectable()
export class GreenhouseProvider implements AutomationProvider {
  private readonly logger = new Logger(GreenhouseProvider.name);

  supports(url: string): boolean {
    return url.includes("greenhouse.io");
  }

  async prepare(context: AutomationContext): Promise<void> {
    await context.log("INFO", "STARTING", "Preparing Greenhouse automation");
  }

  async execute(context: AutomationContext): Promise<void> {
    const { page, playwrightService, profile, resumePath, coverLetterPath } = context;

    await context.log("INFO", "LAUNCH_BROWSER", "Page loaded. Filling standard personal details.");

    // Split name
    let firstName = "";
    let lastName = "";
    if (profile.fullName) {
      const parts = profile.fullName.trim().split(/\s+/);
      firstName = parts[0] || "";
      lastName = parts.slice(1).join(" ") || "Applicant";
    }

    // Fill First Name
    try {
      await playwrightService.safeFill(page, greenhouseSelectors.firstName, firstName);
    } catch {
      await context.log("WARNING", "FILL_PROFILE", "Could not fill first name using selector");
    }

    // Fill Last Name
    try {
      await playwrightService.safeFill(page, greenhouseSelectors.lastName, lastName);
    } catch {
      await context.log("WARNING", "FILL_PROFILE", "Could not fill last name using selector");
    }

    // Fill Email
    try {
      await playwrightService.safeFill(page, greenhouseSelectors.email, profile.email || context.application.userEmail || "");
    } catch {
      await context.log("WARNING", "FILL_PROFILE", "Could not fill email");
    }

    // Fill Phone
    try {
      await playwrightService.safeFill(page, greenhouseSelectors.phone, profile.phone || "");
    } catch {
      await context.log("WARNING", "FILL_PROFILE", "Could not fill phone");
    }

    // Upload Resume
    if (resumePath) {
      await context.log("INFO", "UPLOAD_RESUME", "Uploading resume");
      try {
        await playwrightService.safeUpload(page, greenhouseSelectors.resumeInput, resumePath);
        await context.log("INFO", "UPLOAD_RESUME", "Resume uploaded successfully");
      } catch (err) {
        await context.log("ERROR", "UPLOAD_RESUME", `Failed to upload resume: ${err.message}`);
        throw err;
      }
    }

    // Upload Cover Letter
    if (coverLetterPath) {
      await context.log("INFO", "UPLOAD_COVER_LETTER", "Uploading cover letter");
      try {
        await playwrightService.safeUpload(page, greenhouseSelectors.coverLetterInput, coverLetterPath);
        await context.log("INFO", "UPLOAD_COVER_LETTER", "Cover letter uploaded successfully");
      } catch (err) {
        await context.log("WARNING", "UPLOAD_COVER_LETTER", `Cover letter upload failed or not present: ${err.message}`);
      }
    }

    // Fill Custom Questions
    await context.log("INFO", "FILL_CUSTOM_QUESTIONS", "Processing additional custom questions");
    await this.fillCustomQuestions(context);
  }

  private async fillCustomQuestions(context: AutomationContext): Promise<void> {
    const { page } = context;
    // Greenhouse custom questions are usually standard inputs/selects inside .field divs
    const fields = await page.$$(".field");
    for (const field of fields) {
      try {
        const labelEl = await field.$("label");
        if (!labelEl) continue;
        const labelText = (await labelEl.innerText()).trim();

        // Skip standard labels
        if (
          /first name/i.test(labelText) ||
          /last name/i.test(labelText) ||
          /email/i.test(labelText) ||
          /phone/i.test(labelText) ||
          /resume/i.test(labelText) ||
          /cover letter/i.test(labelText)
        ) {
          continue;
        }

        // Fill custom text input
        const textInput = await field.$("input[type='text'], textarea");
        if (textInput) {
          const isVisible = await textInput.isVisible();
          if (isVisible) {
            // Generate answer if needed
            let answer = "";
            if (/linkedin/i.test(labelText)) {
              answer = context.profile.linkedinUrl || "";
            } else if (/github/i.test(labelText)) {
              answer = context.profile.githubUrl || "";
            } else if (/portfolio/i.test(labelText) || /website/i.test(labelText)) {
              answer = context.profile.portfolioUrl || "";
            } else if (context.aiService) {
              answer = await context.aiService.generateCustomAnswer(labelText, context.profile, context.application);
            }
            await textInput.fill(answer);
          }
        }

        // Fill select / dropdown
        const select = await field.$("select");
        if (select) {
          const isVisible = await select.isVisible();
          if (isVisible) {
            // Pick first option that is not blank or placeholder, or use AI
            const options = await select.$$eval("option", (opts) =>
              opts.map((o) => ({ value: o.value, text: o.textContent || "" }))
            );
            const validOption = options.find((o) => o.value && o.text.trim().length > 0);
            if (validOption) {
              await select.selectOption(validOption.value);
            }
          }
        }
      } catch (err) {
        this.logger.debug(`Could not process custom field: ${err.message}`);
      }
    }
  }

  async submit(context: AutomationContext): Promise<void> {
    const { page, playwrightService } = context;
    await context.log("INFO", "SUBMITTING", "Submitting application");
    try {
      await playwrightService.safeClick(page, greenhouseSelectors.submitButton);
      await page.waitForNavigation({ waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
      await context.log("INFO", "COMPLETED", "Application submitted successfully!");
    } catch (err) {
      await context.log("ERROR", "FAILED", `Failed to click submit button: ${err.message}`);
      throw err;
    }
  }
}
