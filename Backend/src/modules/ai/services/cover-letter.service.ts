import { Injectable } from "@nestjs/common";
import { COVER_SYSTEM_PROMPT, constructCoverPrompt } from "../prompts/cover.prompt";

export interface CoverLetterResponse {
  coverLetter: string;
}

@Injectable()
export class CoverLetterService {
  getSystemPrompt(): string {
    return COVER_SYSTEM_PROMPT;
  }

  getUserPrompt(resumeText: string, profileText: string, jobText: string): string {
    return constructCoverPrompt(resumeText, profileText, jobText);
  }

  generateMock(resumeText: string, profileText: string, jobText: string): CoverLetterResponse {
    return {
      coverLetter: `Dear Hiring Manager,\n\nI am writing to express my enthusiastic interest in the role. Based on my resume showing experience with key technologies and target interests, I am confident I can contribute significantly to your team.\n\nThank you for your time and consideration.\n\nSincerely,\nCandidate`,
    };
  }
}
