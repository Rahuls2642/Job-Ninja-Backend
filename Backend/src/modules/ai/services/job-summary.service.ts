import { Injectable } from "@nestjs/common";
import { SUMMARY_SYSTEM_PROMPT, constructSummaryPrompt } from "../prompts/summary.prompt";

export interface JobSummaryResponse {
  role: string;
  salary: string;
  remote: boolean;
  required: string[];
  benefits: string[];
}

@Injectable()
export class JobSummaryService {
  getSystemPrompt(): string {
    return SUMMARY_SYSTEM_PROMPT;
  }

  getUserPrompt(jobText: string): string {
    return constructSummaryPrompt(jobText);
  }

  generateMock(jobText: string): JobSummaryResponse {
    // Generate summary based on basic keyword matching
    const text = jobText.toLowerCase();
    const role = jobText.split("\n")[0] || "Software Engineer";
    const remote = text.includes("remote") || text.includes("work from home");
    const required = ["React", "TypeScript", "Next.js"];
    const benefits = ["Medical Insurance", "401(k) Match"];

    return {
      role,
      salary: "₹25L",
      remote,
      required,
      benefits,
    };
  }
}
