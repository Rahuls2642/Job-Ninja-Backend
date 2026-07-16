import { Controller, Post, Get, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { GetUser } from "../../auth/decorators/get-user.decorator";
import { AIOrchestratorService } from "../services/ai-orchestrator.service";
import { TailorResumeDto } from "../dto/tailor-resume.dto";

@ApiTags("AI Intelligence Engine")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("ai")
export class AiController {
  constructor(private readonly orchestrator: AIOrchestratorService) {}

  @Post("jobs/:jobId/score")
  @ApiOperation({ summary: "Calculate match score and gap analysis for a job posting" })
  @ApiParam({ name: "jobId", description: "Job ID UUID" })
  @ApiQuery({ name: "resumeId", required: false, description: "Resume ID to analyze (defaults to primary)" })
  @ApiQuery({ name: "refresh", required: false, type: Boolean, description: "Bypass cache and force refresh analysis" })
  @ApiResponse({ status: 200, description: "Match score results computed successfully" })
  async scoreJob(
    @GetUser() user: any,
    @Param("jobId") jobId: string,
    @Query("resumeId") resumeId?: string,
    @Query("refresh") refresh?: string,
  ) {
    const isRefresh = refresh === "true";
    return this.orchestrator.scoreJob(user.id, jobId, resumeId, isRefresh);
  }

  @Post("resumes/:resumeId/tailor")
  @ApiOperation({ summary: "Tailor resume experience blocks and wording for a specific job" })
  @ApiParam({ name: "resumeId", description: "Resume ID UUID" })
  @ApiQuery({ name: "refresh", required: false, type: Boolean, description: "Bypass cache and force refresh tailoring" })
  @ApiResponse({ status: 200, description: "Tailored resume generated successfully" })
  async tailorResume(
    @GetUser() user: any,
    @Param("resumeId") resumeId: string,
    @Body() dto: TailorResumeDto,
    @Query("refresh") refresh?: string,
  ) {
    const isRefresh = refresh === "true";
    return this.orchestrator.tailorResume(user.id, resumeId, dto.jobId, isRefresh);
  }

  @Post("resumes/:resumeId/ats")
  @ApiOperation({ summary: "Calculate ATS compatibility score and keywords suggestions" })
  @ApiParam({ name: "resumeId", description: "Resume ID UUID" })
  @ApiQuery({ name: "jobId", required: true, description: "Job ID to match against" })
  @ApiQuery({ name: "refresh", required: false, type: Boolean, description: "Bypass cache and force refresh ATS score" })
  @ApiResponse({ status: 200, description: "ATS score computed successfully" })
  async atsScore(
    @GetUser() user: any,
    @Param("resumeId") resumeId: string,
    @Query("jobId") jobId: string,
    @Query("refresh") refresh?: string,
  ) {
    const isRefresh = refresh === "true";
    return this.orchestrator.atsScore(user.id, resumeId, jobId, isRefresh);
  }

  @Post("jobs/:jobId/cover-letter")
  @ApiOperation({ summary: "Generate cover letter matching candidate and job requirements" })
  @ApiParam({ name: "jobId", description: "Job ID UUID" })
  @ApiQuery({ name: "resumeId", required: false, description: "Resume ID to use" })
  @ApiQuery({ name: "refresh", required: false, type: Boolean, description: "Bypass cache and force refresh cover letter" })
  @ApiResponse({ status: 200, description: "Cover letter generated successfully" })
  async coverLetter(
    @GetUser() user: any,
    @Param("jobId") jobId: string,
    @Query("resumeId") resumeId?: string,
    @Query("refresh") refresh?: string,
  ) {
    const isRefresh = refresh === "true";
    return this.orchestrator.coverLetter(user.id, jobId, resumeId, isRefresh);
  }

  @Get("jobs/:jobId/summary")
  @ApiOperation({ summary: "Extract structured details and benefits from a job description" })
  @ApiParam({ name: "jobId", description: "Job ID UUID" })
  @ApiQuery({ name: "refresh", required: false, type: Boolean, description: "Bypass cache and force refresh summary" })
  @ApiResponse({ status: 200, description: "Job summary extracted successfully" })
  async jobSummary(
    @Param("jobId") jobId: string,
    @Query("refresh") refresh?: string,
  ) {
    const isRefresh = refresh === "true";
    return this.orchestrator.jobSummary(jobId, isRefresh);
  }

  @Get("jobs/:jobId/cache")
  @ApiOperation({ summary: "Retrieve cached match score report for the user's primary/default resume" })
  @ApiParam({ name: "jobId", description: "Job ID UUID" })
  @ApiResponse({ status: 200, description: "Cached analysis retrieved successfully" })
  async getCachedAnalysis(
    @GetUser() user: any,
    @Param("jobId") jobId: string,
  ) {
    return this.orchestrator.getCachedAnalysis(user.id, jobId);
  }
}
