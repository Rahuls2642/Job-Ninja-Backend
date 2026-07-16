import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsInt, Min } from "class-validator";

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: "John Doe" })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ example: "+1234567890" })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: "USA" })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: "San Francisco" })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: "Senior Software Engineer" })
  @IsString()
  @IsOptional()
  headline?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsInt()
  @Min(0)
  @IsOptional()
  yearsOfExperience?: number;

  @ApiPropertyOptional({ example: "Software Engineer" })
  @IsString()
  @IsOptional()
  currentJobTitle?: string;

  @ApiPropertyOptional({ example: "Tech Lead" })
  @IsString()
  @IsOptional()
  preferredRole?: string;

  @ApiPropertyOptional({ example: "Remote / New York" })
  @IsString()
  @IsOptional()
  preferredLocation?: string;

  @ApiPropertyOptional({ example: "Full-time" })
  @IsString()
  @IsOptional()
  employmentType?: string;

  @ApiPropertyOptional({ example: "$120,000/year" })
  @IsString()
  @IsOptional()
  salaryExpectation?: string;

  @ApiPropertyOptional({ example: "Passionate developer with 5+ years of experience." })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ example: "https://linkedin.com/in/johndoe" })
  @IsString()
  @IsOptional()
  linkedinUrl?: string;

  @ApiPropertyOptional({ example: "https://github.com/johndoe" })
  @IsString()
  @IsOptional()
  githubUrl?: string;

  @ApiPropertyOptional({ example: "https://johndoe.com" })
  @IsString()
  @IsOptional()
  portfolioUrl?: string;
}
