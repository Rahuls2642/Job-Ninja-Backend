import { IsUUID, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AnalyzeJobDto {
  @ApiProperty({ description: "The UUID of the resume to analyze against the job posting" })
  @IsNotEmpty()
  @IsUUID()
  resumeId: string;
}
