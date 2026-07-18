import { Injectable } from "@nestjs/common";
import { JobProvider, ParsedJob } from "./job-provider.interface";

@Injectable()
export class TheMuseProvider implements JobProvider {
  getName(): string {
    return "themuse";
  }

  async fetchJobs(boardToken: string): Promise<ParsedJob[]> {
    try {
      const response = await fetch("https://www.themuse.com/api/public/jobs?page=1");
      if (!response.ok) {
        throw new Error(`The Muse API error: ${response.status}`);
      }

      const data = await response.json();
      if (!data.results || !Array.isArray(data.results)) {
        return [];
      }

      return data.results.map((job: any) => {
        let location = "Unknown";
        if (job.locations && job.locations.length > 0) {
          location = job.locations.map((loc: any) => loc.name).join(", ");
        }

        let experienceLevel = undefined;
        if (job.levels && job.levels.length > 0) {
          experienceLevel = job.levels[0].name;
        }

        const isRemote = location.toLowerCase().includes("remote") || location.toLowerCase().includes("flexible");

        return {
          externalId: `themuse-${job.id}`,
          provider: this.getName(),
          company: job.company?.name || "Unknown Company",
          title: job.name,
          location,
          remote: isRemote,
          experienceLevel,
          description: job.contents || "",
          applicationUrl: job.refs?.landing_page || "",
          sourceUrl: job.refs?.landing_page || "",
          postedAt: job.publication_date ? new Date(job.publication_date) : new Date(),
          isActive: true,
        };
      });
    } catch (error) {
      console.error("[TheMuseProvider] Error fetching jobs:", error);
      return [];
    }
  }
}
