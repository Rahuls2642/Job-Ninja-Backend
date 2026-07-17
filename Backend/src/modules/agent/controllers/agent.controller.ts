import { Controller, Post, Get, Delete, Param, Body, UseGuards, HttpStatus, HttpCode } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { GetUser } from "../../auth/decorators/get-user.decorator";
import { AgentService } from "../services/agent.service";
import { MemoryService } from "../services/memory.service";
import { ChatMessageDto } from "../dto/chat-message.dto";

@ApiTags("AI Agent")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("agent")
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly memoryService: MemoryService,
  ) {}

  @Post("chat")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Send a message to the AI agent to plan and run workflows" })
  @ApiResponse({ status: 200, description: "Message processed, task started" })
  async chat(@GetUser() user: any, @Body() dto: ChatMessageDto) {
    return this.agentService.handleChatMessage(user.id, dto.message, dto.conversationId);
  }

  @Get("conversations")
  @ApiOperation({ summary: "Retrieve all agent conversations for the user" })
  @ApiResponse({ status: 200, description: "List of conversations retrieved" })
  async getConversations(@GetUser() user: any) {
    return this.memoryService.getConversations(user.id);
  }

  @Get("conversations/:id")
  @ApiOperation({ summary: "Retrieve message history of a specific conversation" })
  @ApiParam({ name: "id", description: "Conversation UUID" })
  @ApiResponse({ status: 200, description: "Conversation history retrieved" })
  @ApiResponse({ status: 404, description: "Conversation not found" })
  async getConversationHistory(@GetUser() user: any, @Param("id") id: string) {
    return this.memoryService.getConversationHistory(user.id, id);
  }

  @Get("tasks/:id")
  @ApiOperation({ summary: "Query execution plan status and intermediate results of a workflow task" })
  @ApiParam({ name: "id", description: "Workflow Task UUID" })
  @ApiResponse({ status: 200, description: "Task status details retrieved" })
  @ApiResponse({ status: 404, description: "Task not found" })
  async getTaskStatus(@Param("id") id: string) {
    return this.memoryService.getTask(id);
  }

  @Delete("tasks/:id")
  @ApiOperation({ summary: "Cancel a running workflow task" })
  @ApiParam({ name: "id", description: "Workflow Task UUID" })
  @ApiResponse({ status: 200, description: "Task successfully canceled" })
  @ApiResponse({ status: 400, description: "Task already finished" })
  @ApiResponse({ status: 404, description: "Task not found" })
  async cancelTask(@GetUser() user: any, @Param("id") id: string) {
    return this.agentService.cancelTask(user.id, id);
  }
}
