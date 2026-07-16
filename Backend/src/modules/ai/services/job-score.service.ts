import { Injectable } from "@nestjs/common";
import { SCORE_SYSTEM_PROMPT, constructScorePrompt } from "../prompts/score.prompt";

export interface JobScoreResponse {
  overallScore: number;
  reasons: string[];
  missingSkills: string[];
  suggestions: string[];
}

@Injectable()
export class JobScoreService {
  getSystemPrompt(): string {
    return SCORE_SYSTEM_PROMPT;
  }

  getUserPrompt(resumeText: string, profileText: string, jobText: string): string {
    return constructScorePrompt(resumeText, profileText, jobText);
  }

  generateMock(resumeText: string, profileText: string, jobText: string): JobScoreResponse {
    const combinedText = (resumeText + " " + profileText).toLowerCase();
    const mockSkills = ["react", "typescript", "node", "postgresql", "docker", "redis", "aws", "graphql", "rust", "figma"];
    const reasons: string[] = [];
    const missingSkills: string[] = [];

    // Analyze skills matching
    for (const skill of mockSkills) {
      if (jobText.toLowerCase().includes(skill)) {
        if (combinedText.includes(skill)) {
          reasons.push(`${skill.toUpperCase()} matches standard requirement.`);
        } else {
          missingSkills.push(skill.toUpperCase());
        }
      }
    }

    if (reasons.length === 0) {
      reasons.push("General profile match");
    }
    if (missingSkills.length === 0) {
      missingSkills.push("DOCKER", "REDIS");
    }

    const suggestions = missingSkills.map(
      (skill) => `Consider learning or adding projects using: ${skill}.`
    );

    const score = Math.max(50, 100 - missingSkills.length * 8);

    return {
      overallScore: score,
      reasons,
      missingSkills,
      suggestions,
    };
  }
}
