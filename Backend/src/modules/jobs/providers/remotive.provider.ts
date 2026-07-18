import { Injectable } from "@nestjs/common";
import { JobProvider, ParsedJob } from "./job-provider.interface";

@Injectable()
export class RemotiveProvider implements JobProvider {
  getName(): string {
    return "remotive";
  }

  async fetchJobs(boardToken: string, keyword?: string): Promise<ParsedJob[]> {
    try {
      // If a keyword is provided, search the live API for it! Otherwise get the top 50 recent jobs.
      const baseUrl = "https://remotive.com/api/remote-jobs";
      const url = keyword ? `${baseUrl}?search=${encodeURIComponent(keyword)}&limit=50` : `${baseUrl}?limit=50`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Remotive API error: ${response.status}`);
      }

      const data = await response.json();
      if (!data.jobs || !Array.isArray(data.jobs)) {
        return [];
      }

      return data.jobs.map((job: any) => ({
        externalId: `remotive-${job.id}`,
        provider: this.getName(),
        company: job.company_name,
        companyLogo: job.company_logo,
        title: job.title,
        location: job.candidate_required_location || "Remote",
        remote: true, // Remotive is 100% remote jobs
        employmentType: job.job_type,
        description: job.description || "",
        applicationUrl: job.url,
        sourceUrl: job.url,
        postedAt: job.publication_date ? new Date(job.publication_date) : new Date(),
        isActive: true,
      }));
    } catch (error) {
      console.error("[RemotiveProvider] Error fetching jobs:", error);
      return [];
    }
  }
}
