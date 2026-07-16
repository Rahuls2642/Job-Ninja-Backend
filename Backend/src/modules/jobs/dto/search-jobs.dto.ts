import { IsOptional, IsString, IsBoolean, IsNumber, Min } from "class-validator";
import { Type, Transform } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class SearchJobsDto {
  @ApiPropertyOptional({ description: "Search by job title, company, description, or requirements" })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: "Search by city, country, or location" })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: "Filter for remote-only positions" })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  remote?: boolean;

  @ApiPropertyOptional({ description: "Filter by company name" })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ description: "Filter by employment type (e.g. Full-time, Part-time, Contract)" })
  @IsOptional()
  @IsString()
  employmentType?: string;

  @ApiPropertyOptional({ description: "Filter by minimum expected salary" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salaryMin?: number;

  @ApiPropertyOptional({ description: "Filter by experience level (e.g. Senior, Mid, Junior)" })
  @IsOptional()
  @IsString()
  experienceLevel?: string;

  @ApiPropertyOptional({ description: "Page number for pagination", default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ description: "Items per page", default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit: number = 20;
}
