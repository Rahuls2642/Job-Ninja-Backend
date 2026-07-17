import { IsUUID, IsBoolean, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class StartAutomationDto {
  @ApiProperty({ description: "Application ID to start automation for" })
  @IsUUID()
  applicationId!: string;

  @ApiProperty({ description: "Whether to pause for review before submitting", required: false })
  @IsBoolean()
  @IsOptional()
  reviewBeforeSubmit?: boolean;
}
