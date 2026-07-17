import { Injectable } from "@nestjs/common";
import { AgentTool } from "./agent-tool.interface";
import { JobsService } from "../../jobs/services/jobs.service";

@Injectable()
export class SearchJobsTool implements AgentTool {
  readonly name = "search_jobs";

  constructor(private readonly jobsService: JobsService) {}

  async execute(input: { keyword?: string; location?: string; remote?: boolean; limit?: number }) {
    const results = await this.jobsService.searchJobs({
      keyword: input.keyword,
      location: input.location,
      remote: input.remote,
      page: 1,
      limit: input.limit || 10,
    });
    return results.items;
  }
}
