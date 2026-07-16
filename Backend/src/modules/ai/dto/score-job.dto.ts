import { IsUUID, IsOptional, IsBoolean } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";

export class ScoreJobDto {
  @ApiPropertyOptional({ description: "Specific Resume ID to match against (defaults to user's primary/default resume)", example: "d30c7eb5-7a58-4095-b22e-3735b915a28f" })
  @IsUUID()
  @IsOptional()
  resumeId?: string;

  @ApiPropertyOptional({ description: "Force refresh of the AI analysis, bypassing the cache", example: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  refresh?: boolean;
}
