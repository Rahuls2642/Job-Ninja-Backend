import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Res,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from "@nestjs/swagger";
import { Response } from "express";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { GetUser } from "../../auth/decorators/get-user.decorator";
import { ResumeService } from "../services/resume.service";
import { CreateResumeDto } from "../dto/create-resume.dto";
import { RenameResumeDto } from "../dto/rename-resume.dto";

@ApiTags("Resumes")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("resumes")
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post()
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload a new resume" })
  @ApiBody({
    description: "Resume PDF/DOCX and title",
    type: CreateResumeDto,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Resume uploaded successfully",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        title: { type: "string" },
        isDefault: { type: "boolean" },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Unsupported file type or file too large" })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @UseInterceptors(FileInterceptor("file"))
  async uploadResume(
    @GetUser("id") userId: string,
    @Body() dto: CreateResumeDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.resumeService.uploadResume(userId, dto.title, file);
  }

  @Get()
  @ApiOperation({ summary: "List all resumes for the authenticated user" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "List of resumes",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          default: { type: "boolean" },
          isDefault: { type: "boolean" },
          fileName: { type: "string" },
          fileUrl: { type: "string" },
          version: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  async findAll(@GetUser("id") userId: string) {
    return this.resumeService.findAll(userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get metadata for a specific resume" })
  @ApiParam({ name: "id", description: "Resume UUID" })
  @ApiResponse({ status: HttpStatus.OK, description: "Resume metadata" })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Resume not found" })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  async findOne(@GetUser("id") userId: string, @Param("id") id: string) {
    return this.resumeService.findOne(userId, id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Rename a resume" })
  @ApiParam({ name: "id", description: "Resume UUID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Resume renamed successfully",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        title: { type: "string" },
        isDefault: { type: "boolean" },
        default: { type: "boolean" },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Resume not found" })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  async renameResume(
    @GetUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: RenameResumeDto,
  ) {
    return this.resumeService.renameResume(userId, id, dto.title);
  }

  @Patch(":id/default")
  @ApiOperation({ summary: "Set a resume as default for the user" })
  @ApiParam({ name: "id", description: "Resume UUID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Resume set as default",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        title: { type: "string" },
        isDefault: { type: "boolean" },
        default: { type: "boolean" },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Resume not found" })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  async setDefaultResume(@GetUser("id") userId: string, @Param("id") id: string) {
    return this.resumeService.setDefaultResume(userId, id);
  }

  @Get(":id/download")
  @ApiOperation({ summary: "Download/preview a resume via secure pre-signed URL redirect" })
  @ApiParam({ name: "id", description: "Resume UUID" })
  @ApiResponse({ status: HttpStatus.FOUND, description: "Redirect to pre-signed download URL" })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Resume not found" })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  async downloadResume(
    @GetUser("id") userId: string,
    @Param("id") id: string,
    @Res() res: Response,
  ) {
    const signedUrl = await this.resumeService.downloadResume(userId, id);
    return res.redirect(HttpStatus.FOUND, signedUrl);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a resume (metadata from DB and file from storage)" })
  @ApiParam({ name: "id", description: "Resume UUID" })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: "Resume deleted successfully" })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Resume not found" })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  async deleteResume(@GetUser("id") userId: string, @Param("id") id: string) {
    await this.resumeService.deleteResume(userId, id);
  }
}
