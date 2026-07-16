import { IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class TailorResumeDto {
  @ApiProperty({ description: "Target Job ID to tailor the resume for", example: "4c259cbd-32d2-4946-9373-99296be6e07c" })
  @IsUUID()
  jobId: string;
}
