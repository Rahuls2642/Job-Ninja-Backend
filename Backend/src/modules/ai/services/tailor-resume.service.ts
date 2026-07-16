import { Injectable } from "@nestjs/common";
import { TAILOR_SYSTEM_PROMPT, constructTailorPrompt } from "../prompts/tailor.prompt";

export interface TailorResumeResponse {
  tailoredResume: string;
}

@Injectable()
export class ResumeTailorService {
  getSystemPrompt(): string {
    return TAILOR_SYSTEM_PROMPT;
  }

  getUserPrompt(resumeText: string, jobText: string): string {
    return constructTailorPrompt(resumeText, jobText);
  }

  generateMock(resumeText: string, jobText: string): TailorResumeResponse {
    // Generate a clean tailored version of the resume with skills reordered/highlighted
    return {
      tailoredResume: `[TAILORED RESUME - OPTIMIZED FOR TARGET JOB]\n\n${resumeText}\n\n[Optimized Projects & Alignment]: Highlighted core capabilities relevant to the job requirements described in: "${jobText.substring(0, 100)}..."`,
    };
  }
}
