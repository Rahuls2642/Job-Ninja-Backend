import { Injectable } from "@nestjs/common";
import { ATS_SYSTEM_PROMPT, constructAtsPrompt } from "../prompts/ats.prompt";

export interface AtsScoreResponse {
  atsScore: number;
  missingSkills: string[];
  suggestions: string[];
}

@Injectable()
export class ATSScoreService {
  getSystemPrompt(): string {
    return ATS_SYSTEM_PROMPT;
  }

  getUserPrompt(resumeText: string, jobText: string): string {
    return constructAtsPrompt(resumeText, jobText);
  }

  generateMock(resumeText: string, jobText: string): AtsScoreResponse {
    const combinedText = (resumeText + " " + jobText).toLowerCase();
    const skillsList = ["react", "typescript", "node", "postgresql", "docker", "redis", "aws", "graphql", "rust", "figma"];
    const missingSkills: string[] = [];
    const suggestions: string[] = [];

    // Analyze skills matching
    for (const skill of skillsList) {
      if (jobText.toLowerCase().includes(skill) && !resumeText.toLowerCase().includes(skill)) {
        missingSkills.push(skill.toUpperCase());
        suggestions.push(`Include concrete achievements highlighting the use of ${skill.toUpperCase()} under your experience.`);
      }
    }

    if (missingSkills.length === 0) {
      missingSkills.push("DOCKER", "GRAPHQL");
      suggestions.push("Move React higher in your skills list.");
      suggestions.push("Explicitly mention PostgreSQL under your database section.");
    }

    const score = Math.max(70, 100 - missingSkills.length * 6);

    return {
      atsScore: score,
      missingSkills,
      suggestions,
    };
  }
}
