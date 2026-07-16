import { Injectable } from "@nestjs/common";
import { JobProvider, ParsedJob } from "./job-provider.interface";

@Injectable()
export class AshbyProvider implements JobProvider {
  getName(): string {
    return "ashby";
  }

  async fetchJobs(boardToken: string): Promise<ParsedJob[]> {
    if (!boardToken || boardToken.toLowerCase().startsWith("mock")) {
      return this.getMockJobs();
    }

    try {
      const response = await fetch(`https://api.ashbyhq.com/v1/jobBoard/${boardToken}/postings`);
      if (!response.ok) {
        throw new Error(`Ashby API responded with status ${response.status}`);
      }

      const data = (await response.json()) as any;
      if (!data.postings || !Array.isArray(data.postings)) {
        return [];
      }

      return data.postings.map((job: any) => ({
        externalId: String(job.id),
        provider: this.getName(),
        company: boardToken,
        title: job.title,
        location: job.location || "Remote",
        remote: job.isRemote || (job.location || "").toLowerCase().includes("remote"),
        employmentType: job.employmentType || "Full-time",
        description: job.descriptionHtml || job.description || "",
        applicationUrl: job.infoUrl,
        sourceUrl: job.infoUrl,
        postedAt: job.publishedAt ? new Date(job.publishedAt) : new Date(),
        isActive: true,
      }));
    } catch (error) {
      console.error(`[AshbyProvider] Failed to fetch jobs for ${boardToken}:`, error);
      return this.getMockJobs(); // Fallback
    }
  }

  private getMockJobs(): ParsedJob[] {
    return [
      {
        externalId: "ashby-mock-1",
        provider: this.getName(),
        company: "Linear",
        companyLogo: "https://linear.app/favicon.ico",
        title: "Staff Systems Engineer (Rust)",
        location: "Remote, EU/US",
        remote: true,
        employmentType: "Full-time",
        experienceLevel: "Senior",
        salaryMin: 180000,
        salaryMax: 230000,
        currency: "EUR",
        description: "Build fast and reliable backend systems using Rust. You will optimize sync protocols and database drivers.",
        requirements: "Expert Rust level, 8+ years systems engineering experience, Distributed systems design",
        benefits: "Competitive equity, fully covered healthcare, 30 days off, remote workstation stipend",
        applicationUrl: "https://jobs.ashbyhq.com/linear/mock-1/apply",
        sourceUrl: "https://jobs.ashbyhq.com/linear/mock-1",
        postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      },
      {
        externalId: "ashby-mock-2",
        provider: this.getName(),
        company: "Retool",
        companyLogo: "https://retool.com/favicon.ico",
        title: "Developer Advocate (JavaScript/APIs)",
        location: "San Francisco, CA",
        remote: false,
        employmentType: "Full-time",
        experienceLevel: "Mid",
        salaryMin: 130000,
        salaryMax: 170000,
        currency: "USD",
        description: "Engage the Retool developer community. Build integrations, write technical articles, and present live build sessions.",
        requirements: "Strong background in JS/Node.js, Active in developer communities, Experience building integrations",
        benefits: "401(k) matching, health/wellness coverage, catered lunches, commuter benefits",
        applicationUrl: "https://jobs.ashbyhq.com/retool/mock-2/apply",
        sourceUrl: "https://jobs.ashbyhq.com/retool/mock-2",
        postedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      },
    ];
  }
}
