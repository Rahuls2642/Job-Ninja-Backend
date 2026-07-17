import { IsOptional, IsEnum, IsString, IsInt, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { ApplicationStatus } from "./update-status.dto";

export class GetApplicationsFilterDto {
  @ApiPropertyOptional({ description: "Filter applications by status", enum: ApplicationStatus })
  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;

  @ApiPropertyOptional({ description: "Filter by company name" })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiPropertyOptional({ description: "Filter by keyword search in job title, description, or notes" })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ description: "Filter by date applied (YYYY-MM-DD)" })
  @IsString()
  @IsOptional()
  appliedDate?: string;

  @ApiPropertyOptional({ description: "Page number for pagination", default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiPropertyOptional({ description: "Limit number of records per page", default: 10 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;

  @ApiPropertyOptional({ description: "Sort field and order (e.g. 'createdAt:desc', 'appliedAt:asc')", default: "createdAt:desc" })
  @IsString()
  @IsOptional()
  sort?: string = "createdAt:desc";
}
