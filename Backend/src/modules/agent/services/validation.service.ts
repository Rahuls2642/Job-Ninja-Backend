import { Injectable, BadRequestException } from "@nestjs/common";

@Injectable()
export class ValidationService {
  validateToolInput(toolName: string, input: any) {
    if (!input) {
      throw new BadRequestException(`Input payload is empty for tool ${toolName}`);
    }

    switch (toolName) {
      case "search_jobs":
        // At least keyword or location should be defined
        if (!input.keyword && !input.location) {
          throw new BadRequestException("SearchJobs requires at least a keyword or location.");
        }
        break;
      case "score_job":
      case "tailor_resume":
      case "generate_cover_letter":
      case "create_application":
        if (!input.jobId || !input.resumeId) {
          throw new BadRequestException(`Tool ${toolName} requires both jobId and resumeId`);
        }
        break;
      case "start_automation":
        if (!input.applicationId) {
          throw new BadRequestException("StartAutomation requires applicationId");
        }
        break;
    }
  }
}
