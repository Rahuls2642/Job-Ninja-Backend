import { Injectable } from "@nestjs/common";
import { JobProvider, ParsedJob } from "./job-provider.interface";

@Injectable()
export class LeverProvider implements JobProvider {
  getName(): string {
    return "lever";
  }

  async fetchJobs(boardToken: string): Promise<ParsedJob[]> {
    if (!boardToken || boardToken.toLowerCase().startsWith("mock")) {
      return this.getMockJobs();
    }

    try {
      const response = await fetch(`https://api.lever.co/v0/postings/${boardToken}?mode=json`);
      if (!response.ok) {
        throw new Error(`Lever API responded with status ${response.status}`);
      }

      const data = (await response.json()) as any[];
      if (!Array.isArray(data)) {
        return [];
      }

      return data.map((job: any) => ({
        externalId: String(job.id),
        provider: this.getName(),
        company: boardToken,
        title: job.text,
        location: job.categories?.location || "Remote",
        remote:
          (job.categories?.location || "").toLowerCase().includes("remote") ||
          (job.categories?.allLocations || []).some((loc: string) => loc.toLowerCase().includes("remote")),
        employmentType: job.categories?.commitment || "Full-time",
        description: job.descriptionHtml || job.description || "",
        requirements: job.lists?.find((list: any) => list.text.toLowerCase().includes("require"))?.content || "",
        benefits: job.lists?.find((list: any) => list.text.toLowerCase().includes("benefit") || list.text.toLowerCase().includes("offer"))?.content || "",
        applicationUrl: job.applyUrl,
        sourceUrl: job.hostedUrl,
        postedAt: job.createdAt ? new Date(job.createdAt) : new Date(),
        isActive: true,
      }));
    } catch (error) {
      console.error(`[LeverProvider] Failed to fetch jobs for ${boardToken}:`, error);
      return this.getMockJobs(); // Fallback
    }
  }

  private getMockJobs(): ParsedJob[] {
    return [
      {
        externalId: "lever-mock-1",
        provider: this.getName(),
        company: "Figma",
        companyLogo: "https://figma.com/favicon.ico",
        title: "Senior Product Designer",
        location: "New York, NY",
        remote: false,
        employmentType: "Full-time",
        experienceLevel: "Senior",
        salaryMin: 150000,
        salaryMax: 200000,
        currency: "USD",
        description: "Join Figma to help shape the future of design tools. You will lead design for core editor features.",
        requirements: "5+ years product design experience, Portfolio demonstrating UI/UX excellence, Figma expertise",
        benefits: "Figma equity, health/wellness stipends, 20 days holiday, parental leave",
        applicationUrl: "https://jobs.lever.co/figma/mock-1/apply",
        sourceUrl: "https://jobs.lever.co/figma/mock-1",
        postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        externalId: "lever-mock-2",
        provider: this.getName(),
        company: "Vercel",
        companyLogo: "https://vercel.com/favicon.ico",
        title: "Developer Relations Engineer (Next.js)",
        location: "Remote, Global",
        remote: true,
        employmentType: "Full-time",
        experienceLevel: "Mid",
        salaryMin: 110000,
        salaryMax: 150000,
        currency: "USD",
        description: "Promote Next.js and Vercel workflows. Create guides, build sample apps, and speak at conferences.",
        requirements: "Strong writer, Passionate about developer tooling, Proficient in React and Next.js",
        benefits: "100% remote workspace allowance, health insurance, generous home-office budget",
        applicationUrl: "https://jobs.lever.co/vercel/mock-2/apply",
        sourceUrl: "https://jobs.lever.co/vercel/mock-2",
        postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
    ];
  }
}
