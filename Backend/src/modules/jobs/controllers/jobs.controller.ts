import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { GetUser } from "../../auth/decorators/get-user.decorator";
import { JobsService } from "../services/jobs.service";
import { SearchJobsDto } from "../dto/search-jobs.dto";

@ApiTags("Jobs")
@Controller("jobs")
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @ApiOperation({ summary: "Search and filter job postings" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Paginated list of job postings matching filter criteria",
    schema: {
      type: "object",
      properties: {
        items: { type: "array", items: { type: "object" } },
        page: { type: "integer" },
        limit: { type: "integer" },
        total: { type: "integer" },
        totalPages: { type: "integer" },
      },
    },
  })
  async searchJobs(@Query() query: SearchJobsDto) {
    return this.jobsService.searchJobs(query);
  }

  @Get("saved")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Retrieve all saved jobs for the logged-in user" })
  @ApiResponse({ status: HttpStatus.OK, description: "List of saved jobs" })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  async findSavedJobs(@GetUser("id") userId: string) {
    return this.jobsService.findSavedJobs(userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get detailed information for a specific job posting" })
  @ApiParam({ name: "id", description: "Job UUID" })
  @ApiResponse({ status: HttpStatus.OK, description: "Job posting details" })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Job posting not found" })
  async findOne(@Param("id") id: string) {
    return this.jobsService.findOne(id);
  }

  @Post(":id/save")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Save a job posting to the user's saved list" })
  @ApiParam({ name: "id", description: "Job UUID" })
  @ApiResponse({ status: HttpStatus.OK, description: "Job saved successfully" })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Job not found" })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  async saveJob(@GetUser("id") userId: string, @Param("id") id: string) {
    return this.jobsService.saveJob(userId, id);
  }

  @Delete(":id/save")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Remove a saved job posting from the user's list" })
  @ApiParam({ name: "id", description: "Job UUID" })
  @ApiResponse({ status: HttpStatus.OK, description: "Job removed from saved list" })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Saved job not found" })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  async removeSavedJob(@GetUser("id") userId: string, @Param("id") id: string) {
    return this.jobsService.removeSavedJob(userId, id);
  }

  @Post("sync")
  @ApiOperation({ summary: "Manually trigger syncing jobs from a provider board" })
  @ApiResponse({ status: HttpStatus.OK, description: "Sync operation results" })
  async syncJobs(
    @Body("provider") provider: string,
    @Body("boardToken") boardToken: string,
  ) {
    return this.jobsService.syncJobs(provider, boardToken);
  }
}
