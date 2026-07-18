export interface ParsedJob {
  externalId: string;
  provider: string;
  company: string;
  companyLogo?: string;
  title: string;
  location?: string;
  remote: boolean;
  employmentType?: string;
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  applicationUrl?: string;
  sourceUrl?: string;
  postedAt?: Date;
  expiresAt?: Date;
}

export interface JobProvider {
  getName(): string;
  fetchJobs(boardToken: string, keyword?: string): Promise<ParsedJob[]>;
}
