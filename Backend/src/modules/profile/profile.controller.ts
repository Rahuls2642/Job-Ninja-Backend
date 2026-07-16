import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Req,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { GetUser } from "../auth/decorators/get-user.decorator";
import { ProfileService } from "./profile.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import * as fs from "fs";

@ApiTags("Profile")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("profile")
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: "Get the current user's profile" })
  @ApiResponse({ status: 200, description: "Profile retrieved successfully" })
  async getProfile(@GetUser("id") userId: string) {
    return this.profileService.getProfile(userId);
  }

  @Patch()
  @ApiOperation({ summary: "Update the current user's profile" })
  @ApiResponse({ status: 200, description: "Profile updated successfully" })
  async updateProfile(
    @GetUser("id") userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(userId, dto);
  }

  @Post("avatar")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Upload and update the user's avatar" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: "Avatar updated successfully" })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (req, file, callback) => {
          const dir = "./uploads";
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          callback(null, dir);
        },
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `avatar-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return callback(
            new BadRequestException("Only image files (jpg, jpeg, png, webp) are allowed"),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async uploadAvatar(
    @GetUser("id") userId: string,
    @UploadedFile() file: any,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException("No file uploaded or file type is invalid");
    }

    // Return the URL to access the uploaded file
    const protocol = req.protocol;
    const host = req.get("host");
    const avatarUrl = `${protocol}://${host}/uploads/${file.filename}`;

    return this.profileService.updateAvatar(userId, avatarUrl);
  }

  @Delete("avatar")
  @ApiOperation({ summary: "Delete the user's avatar" })
  @ApiResponse({ status: 200, description: "Avatar deleted successfully" })
  async deleteAvatar(@GetUser("id") userId: string) {
    return this.profileService.deleteAvatar(userId);
  }
}
