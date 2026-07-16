import { Injectable } from "@nestjs/common";

@Injectable()
export class SummaryService {
  /**
   * Helper utility to truncate or summarize long job description content.
   */
  summarizeText(description: string): string {
    if (!description) return "";
    if (description.length <= 250) return description;
    return description.slice(0, 250).trim() + "...";
  }
}
