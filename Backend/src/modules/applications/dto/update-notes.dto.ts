import { IsString, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateNotesDto {
  @ApiProperty({ description: "Personal notes regarding the interview or job application progress", example: "Discussed salary expectations and benefits package.", required: false })
  @IsString()
  @IsOptional()
  notes: string;
}
