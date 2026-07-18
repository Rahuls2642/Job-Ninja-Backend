import { Injectable } from "@nestjs/common";
import { JobProvider, ParsedJob } from "./job-provider.interface";

@Injectable()
export class LinkedinProvider implements JobProvider {
  getName(): string {
    return "linkedin";
  }

  async fetchJobs(boardToken: string): Promise<ParsedJob[]> {
    // Note: Fetching live jobs from LinkedIn requires authenticated API access or a scraping service (like RapidAPI).
    // For now, we return high-quality mock data so the platform can demonstrate capability.
    return this.getMockJobs();
  }

  private getMockJobs(): ParsedJob[] {
    return [
      {
        externalId: "li-mock-1",
        provider: this.getName(),
        company: "Google",
        companyLogo: "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg",
        title: "Staff Software Engineer",
        location: "Mountain View, CA",
        remote: false,
        employmentType: "Full-time",
        experienceLevel: "Staff",
        salaryMin: 180000,
        salaryMax: 260000,
        currency: "USD",
        description: "Google's software engineers develop the next-generation technologies that change how billions of users connect, explore, and interact with information and one another.",
        requirements: "8+ years of experience with software development in one or more programming languages, and with data structures/algorithms. Experience working with microservices and large-scale systems.",
        benefits: "Health, Dental, Vision, 401(k), on-site meals, wellness programs",
        applicationUrl: "https://www.linkedin.com/jobs/view/mock-1",
        sourceUrl: "https://www.linkedin.com/jobs/view/mock-1",
        postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        externalId: "li-mock-web-1",
        provider: this.getName(),
        company: "Vercel",
        companyLogo: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Vercel_logo_black.svg",
        title: "Senior Web Developer",
        location: "Remote, US",
        remote: true,
        employmentType: "Full-time",
        experienceLevel: "Senior",
        salaryMin: 150000,
        salaryMax: 200000,
        currency: "USD",
        description: "We are looking for a Web Developer who loves building fast, responsive, and accessible web experiences.",
        requirements: "5+ years of experience with React, Next.js, TypeScript, and modern CSS. Strong understanding of web performance.",
        benefits: "Fully remote, unlimited PTO, home office stipend",
        applicationUrl: "https://www.linkedin.com/jobs/view/mock-web",
        sourceUrl: "https://www.linkedin.com/jobs/view/mock-web",
        postedAt: new Date(),
      },
      {
        externalId: "li-mock-2",
        provider: this.getName(),
        company: "Microsoft",
        companyLogo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
        title: "Product Manager - AI",
        location: "Redmond, WA",
        remote: true,
        employmentType: "Full-time",
        experienceLevel: "Mid-Senior",
        salaryMin: 145000,
        salaryMax: 195000,
        currency: "USD",
        description: "Join the Azure AI team to help build the world's most comprehensive AI platform. You will work on defining product strategy and delivering features for generative AI services.",
        requirements: "4+ years in product management, experience with AI/ML products, strong analytical and communication skills.",
        benefits: "Health insurance, ESPP, 401(k) matching, flexible work arrangements",
        applicationUrl: "https://www.linkedin.com/jobs/view/mock-2",
        sourceUrl: "https://www.linkedin.com/jobs/view/mock-2",
        postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        externalId: "li-mock-3",
        provider: this.getName(),
        company: "Netflix",
        companyLogo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
        title: "Senior Data Scientist",
        location: "Los Gatos, CA",
        remote: false,
        employmentType: "Full-time",
        experienceLevel: "Senior",
        salaryMin: 200000,
        salaryMax: 300000,
        currency: "USD",
        description: "Help us optimize content delivery and improve our personalization algorithms using massive datasets.",
        requirements: "5+ years experience in Data Science, proficiency in Python, SQL, and Spark. Strong background in statistical modeling and machine learning.",
        benefits: "Unlimited PTO, comprehensive health coverage, Netflix subscription",
        applicationUrl: "https://www.linkedin.com/jobs/view/mock-3",
        sourceUrl: "https://www.linkedin.com/jobs/view/mock-3",
        postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      }
    ];
  }
}
