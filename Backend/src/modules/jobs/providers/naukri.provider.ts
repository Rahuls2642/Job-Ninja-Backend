import { Injectable } from "@nestjs/common";
import { JobProvider, ParsedJob } from "./job-provider.interface";

@Injectable()
export class NaukriProvider implements JobProvider {
  getName(): string {
    return "naukri";
  }

  async fetchJobs(boardToken: string): Promise<ParsedJob[]> {
    // Note: Live Naukri scraping requires specialized anti-bot bypass strategies.
    // We return rich mock data to demonstrate functionality in the platform.
    return this.getMockJobs();
  }

  private getMockJobs(): ParsedJob[] {
    return [
      {
        externalId: "nk-mock-1",
        provider: this.getName(),
        company: "Tata Consultancy Services",
        companyLogo: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg",
        title: "Cloud Architect",
        location: "Bangalore, Karnataka",
        remote: true,
        employmentType: "Full-time",
        experienceLevel: "Senior",
        salaryMin: 2500000, // INR
        salaryMax: 4000000, // INR
        currency: "INR",
        description: "Looking for an experienced Cloud Architect to design and implement robust cloud solutions on AWS and Azure for our enterprise clients.",
        requirements: "10+ years IT experience, 4+ years in cloud architecture, AWS/Azure certifications preferred. Excellent stakeholder management skills.",
        benefits: "Health insurance, gratuity, provident fund, flexible hours",
        applicationUrl: "https://www.naukri.com/job-listings-mock-1",
        sourceUrl: "https://www.naukri.com/job-listings-mock-1",
        postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        externalId: "nk-mock-2",
        provider: this.getName(),
        company: "Infosys",
        companyLogo: "https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg",
        title: "Backend Developer (Node.js)",
        location: "Pune, Maharashtra",
        remote: false,
        employmentType: "Full-time",
        experienceLevel: "Mid",
        salaryMin: 1200000, // INR
        salaryMax: 1800000, // INR
        currency: "INR",
        description: "Join our core engineering team to build scalable APIs and microservices for fintech applications.",
        requirements: "3-5 years experience with Node.js, Express, MongoDB, and Redis. Good understanding of asynchronous programming.",
        benefits: "Health coverage, meal vouchers, performance bonus",
        applicationUrl: "https://www.naukri.com/job-listings-mock-2",
        sourceUrl: "https://www.naukri.com/job-listings-mock-2",
        postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      }
    ];
  }
}
