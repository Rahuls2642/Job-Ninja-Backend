import { Injectable } from "@nestjs/common";

@Injectable()
export class JobAnalyzerService {
  /**
   * Formats a job entity's fields into a single text representation for the AI prompt.
   */
  formatJob(job: any): string {
    const lines: string[] = [];
    lines.push(`Company: ${job.company}`);
    lines.push(`Title: ${job.title}`);
    if (job.location) lines.push(`Location: ${job.location}`);
    lines.push(`Remote: ${job.remote ? "Yes" : "No"}`);
    if (job.employmentType) lines.push(`Employment Type: ${job.employmentType}`);
    if (job.experienceLevel) lines.push(`Experience Level: ${job.experienceLevel}`);
    
    const salaryMin = job.salaryMin;
    const salaryMax = job.salaryMax;
    const currency = job.currency || "USD";
    if (salaryMin !== null || salaryMax !== null) {
      lines.push(`Salary Range: ${salaryMin || 0} - ${salaryMax || "Negotiable"} ${currency}`);
    }

    if (job.description) {
      lines.push(`\nDescription:\n${job.description}`);
    }
    if (job.requirements) {
      lines.push(`\nRequirements:\n${job.requirements}`);
    }
    if (job.benefits) {
      lines.push(`\nBenefits:\n${job.benefits}`);
    }

    return lines.join("\n");
  }
}
