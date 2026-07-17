import { Controller, Post, Get, Patch, Delete, Param, Body, Query, UseGuards, HttpCode } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { GetUser } from "../../auth/decorators/get-user.decorator";
import { ApplicationsService } from "../services/applications.service";
import { CreateApplicationDto } from "../dto/create-application.dto";
import { UpdateStatusDto } from "../dto/update-status.dto";
import { UpdateNotesDto } from "../dto/update-notes.dto";
import { GetApplicationsFilterDto } from "../dto/get-applications-filter.dto";

@ApiTags("Application Management")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("applications")
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new job application tracking record" })
  @ApiResponse({ status: 201, description: "Application successfully created" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  @ApiResponse({ status: 409, description: "Duplicate application detected" })
  async create(@GetUser() user: any, @Body() dto: CreateApplicationDto) {
    return this.applicationsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "List and search all applications with pagination and filters" })
  @ApiResponse({ status: 200, description: "Paginated applications list retrieved successfully" })
  async findAll(@GetUser() user: any, @Query() filter: GetApplicationsFilterDto) {
    return this.applicationsService.findAll(user.id, filter);
  }

  @Get("stats")
  @ApiOperation({ summary: "Get aggregated dashboard statistics for applications (interview rate, offer rate, pending, etc.)" })
  @ApiResponse({ status: 200, description: "Dashboard statistics calculated successfully" })
  async getStats(@GetUser() user: any) {
    return this.applicationsService.getStats(user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get complete details for a specific application including timeline and attached documents" })
  @ApiParam({ name: "id", description: "Application ID UUID" })
  @ApiResponse({ status: 200, description: "Detailed application record successfully retrieved" })
  @ApiResponse({ status: 404, description: "Application not found" })
  async findOne(@GetUser() user: any, @Param("id") id: string) {
    return this.applicationsService.findOne(user.id, id);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Update application recruitment status (e.g. DRAFT to INTERVIEW)" })
  @ApiParam({ name: "id", description: "Application ID UUID" })
  @ApiResponse({ status: 200, description: "Application status updated and timeline event logged" })
  @ApiResponse({ status: 404, description: "Application not found" })
  async updateStatus(
    @GetUser() user: any,
    @Param("id") id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.applicationsService.updateStatus(user.id, id, dto.status);
  }

  @Patch(":id/notes")
  @ApiOperation({ summary: "Add or update personal progress notes for an application" })
  @ApiParam({ name: "id", description: "Application ID UUID" })
  @ApiResponse({ status: 200, description: "Application notes updated successfully" })
  @ApiResponse({ status: 404, description: "Application not found" })
  async updateNotes(
    @GetUser() user: any,
    @Param("id") id: string,
    @Body() dto: UpdateNotesDto,
  ) {
    return this.applicationsService.updateNotes(user.id, id, dto.notes);
  }

  @Delete(":id")
  @HttpCode(200)
  @ApiOperation({ summary: "Delete an application record" })
  @ApiParam({ name: "id", description: "Application ID UUID" })
  @ApiResponse({ status: 200, description: "Application deleted successfully" })
  @ApiResponse({ status: 404, description: "Application not found" })
  async delete(@GetUser() user: any, @Param("id") id: string) {
    return this.applicationsService.delete(user.id, id);
  }
}
