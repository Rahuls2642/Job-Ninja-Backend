import { Controller, Post, Get, Delete, Param, Body, UseGuards, HttpStatus, HttpCode } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { GetUser } from "../../auth/decorators/get-user.decorator";
import { AutomationService } from "../services/automation.service";
import { AutomationTaskService } from "../services/automation-task.service";
import { StartAutomationDto } from "../dto/start-automation.dto";

@ApiTags("Automation Engine")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("automation")
export class AutomationController {
  constructor(
    private readonly automationService: AutomationService,
    private readonly taskService: AutomationTaskService,
  ) {}

  @Post("start")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Start browser automation workflow for a job application" })
  @ApiResponse({ status: 200, description: "Automation task started and queued" })
  @ApiResponse({ status: 400, description: "Invalid request payload or unsupported provider" })
  @ApiResponse({ status: 409, description: "Automation task already active for this application" })
  async start(@GetUser() user: any, @Body() dto: StartAutomationDto) {
    return this.automationService.startAutomation(user.id, dto);
  }

  @Get("tasks/:id")
  @ApiOperation({ summary: "Get current status and progress of an automation task" })
  @ApiParam({ name: "id", description: "Automation Task ID" })
  @ApiResponse({ status: 200, description: "Task status details retrieved" })
  @ApiResponse({ status: 404, description: "Task not found" })
  async getTask(@GetUser() user: any, @Param("id") id: string) {
    return this.taskService.getTask(user.id, id);
  }

  @Get("tasks/:id/logs")
  @ApiOperation({ summary: "Get detailed execution logs of an automation task" })
  @ApiParam({ name: "id", description: "Automation Task ID" })
  @ApiResponse({ status: 200, description: "Logs list retrieved successfully" })
  @ApiResponse({ status: 404, description: "Task not found" })
  async getLogs(@GetUser() user: any, @Param("id") id: string) {
    return this.taskService.getLogs(user.id, id);
  }

  @Get("tasks/:id/screenshots")
  @ApiOperation({ summary: "Get screenshots taken during automation task" })
  @ApiParam({ name: "id", description: "Automation Task ID" })
  @ApiResponse({ status: 200, description: "Screenshots list retrieved successfully" })
  @ApiResponse({ status: 404, description: "Task not found" })
  async getScreenshots(@GetUser() user: any, @Param("id") id: string) {
    return this.taskService.getScreenshots(user.id, id);
  }

  @Delete("tasks/:id")
  @ApiOperation({ summary: "Cancel a currently running automation task" })
  @ApiParam({ name: "id", description: "Automation Task ID" })
  @ApiResponse({ status: 200, description: "Task successfully canceled" })
  @ApiResponse({ status: 400, description: "Task already finished" })
  @ApiResponse({ status: 404, description: "Task not found" })
  async cancel(@GetUser() user: any, @Param("id") id: string) {
    return this.automationService.cancelAutomation(user.id, id);
  }

  @Post("tasks/:id/retry")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Manually retry a failed automation task" })
  @ApiParam({ name: "id", description: "Automation Task ID" })
  @ApiResponse({ status: 200, description: "Task successfully requeued" })
  @ApiResponse({ status: 400, description: "Task is not failed" })
  @ApiResponse({ status: 404, description: "Task not found" })
  async retry(@GetUser() user: any, @Param("id") id: string) {
    return this.automationService.retryAutomation(user.id, id);
  }
}
