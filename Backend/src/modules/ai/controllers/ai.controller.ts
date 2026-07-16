import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { GetUser } from "../../auth/decorators/get-user.decorator";
import { MatchScoreService } from "../services/match-score.service";
import { AnalyzeJobDto } from "../dto/analyze-job.dto";

@ApiTags("AI Matching")
@Controller("ai")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private readonly matchScoreService: MatchScoreService) {}

  @Post("analyze/:jobId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Analyze a job posting against a user resume" })
  @ApiParam({ name: "jobId", description: "Job UUID" })
  @ApiQuery({ name: "refresh", type: Boolean, required: false, description: "Force re-analysis and skip cache" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Match analysis results including score, strengths, and suggestions",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        userId: { type: "string" },
        resumeId: { type: "string" },
        jobId: { type: "string" },
        overallScore: { type: "integer" },
        strengths: { type: "array", items: { type: "string" } },
        missingSkills: { type: "array", items: { type: "string" } },
        suggestions: { type: "array", items: { type: "string" } },
        summary: {
          type: "object",
          properties: {
            company: { type: "string" },
            role: { type: "string" },
            remote: { type: "boolean" },
          },
        },
        createdAt: { type: "string" },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Invalid resume ID or payload" })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Job or Resume not found" })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  async analyzeJob(
    @GetUser("id") userId: string,
    @Param("jobId") jobId: string,
    @Body() dto: AnalyzeJobDto,
    @Query("refresh") refresh?: string,
  ) {
    const isRefresh = refresh === "true" || refresh === "1";
    return this.matchScoreService.analyzeJob(userId, jobId, dto.resumeId, isRefresh);
  }

  @Get("analyze/:jobId")
  @ApiOperation({ summary: "Get existing/cached analysis for a job" })
  @ApiParam({ name: "jobId", description: "Job UUID" })
  @ApiResponse({ status: HttpStatus.OK, description: "Existing match analysis" })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "No analysis found for this job" })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  async getExistingAnalysis(
    @GetUser("id") userId: string,
    @Param("jobId") jobId: string,
  ) {
    return this.matchScoreService.getExistingAnalysis(userId, jobId);
  }
}
