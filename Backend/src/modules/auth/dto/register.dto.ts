import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "user@example.com", description: "The email of the user" })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: "password123", description: "The password (min 6 characters)" })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ example: "John Doe", description: "The full name of the user" })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiPropertyOptional({ example: "https://example.com/avatar.jpg" })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

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

  @ApiPropertyOptional({ example: "New York, USA" })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: "3 years" })
  @IsString()
  @IsOptional()
  experience?: string;

  @ApiPropertyOptional({ example: "Software Engineer" })
  @IsString()
  @IsOptional()
  preferredRole?: string;

  @ApiPropertyOptional({ example: "$100,000/year" })
  @IsString()
  @IsOptional()
  salaryExpectation?: string;
}
