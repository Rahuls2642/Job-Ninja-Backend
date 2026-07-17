import { IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateApplicationDto {
  @ApiProperty({ description: "Job ID UUID to apply for", example: "4c259cbd-32d2-4946-9373-99296be6e07c" })
  @IsUUID()
  jobId: string;

  @ApiProperty({ description: "Resume ID UUID to attach to this application", example: "d30c7eb5-7a58-4095-b22e-3735b915a28f" })
  @IsUUID()
  resumeId: string;
}
