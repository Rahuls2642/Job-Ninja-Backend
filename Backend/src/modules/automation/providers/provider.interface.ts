import { Page } from "playwright";
import { PlaywrightService } from "../playwright/playwright.service";

export interface AutomationContext {
  page: Page;
  playwrightService: PlaywrightService;
  profile: any;
  resumePath: string;
  coverLetterPath?: string;
  application: any;
  aiService?: any;
  log: (level: "INFO" | "WARNING" | "ERROR", step: string, message: string) => Promise<void>;
  screenshot: (step: string) => Promise<void>;
}

export interface AutomationProvider {
  supports(url: string): boolean;
  prepare(context: AutomationContext): Promise<void>;
  execute(context: AutomationContext): Promise<void>;
  submit(context: AutomationContext): Promise<void>;
}
