import { Injectable } from "@nestjs/common";
import { JobProvider, ParsedJob } from "./job-provider.interface";

@Injectable()
export class ArbeitnowProvider implements JobProvider {
  getName(): string {
    return "arbeitnow";
  }

  async fetchJobs(boardToken: string): Promise<ParsedJob[]> {
    try {
      const response = await fetch("https://www.arbeitnow.com/api/job-board-api");
      if (!response.ok) {
        throw new Error(`Arbeitnow API error: ${response.status}`);
      }

      const responseData = await response.json();
      if (!responseData.data || !Array.isArray(responseData.data)) {
        return [];
      }

      return responseData.data.map((job: any) => ({
        externalId: `arbeitnow-${job.slug}`,
        provider: this.getName(),
        company: job.company_name,
        title: job.title,
        location: job.location,
        remote: job.remote,
        employmentType: job.job_types && job.job_types.length > 0 ? job.job_types.join(", ") : undefined,
        description: job.description || "",
        applicationUrl: job.url,
        sourceUrl: job.url,
        postedAt: job.created_at ? new Date(job.created_at * 1000) : new Date(),
        isActive: true,
      }));
    } catch (error) {
      console.error("[ArbeitnowProvider] Error fetching jobs:", error);
      return [];
    }
  }
}
