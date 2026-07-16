import { IsNotEmpty, IsString, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateResumeDto {
  @ApiProperty({
    description: "The title of the resume",
    example: "Frontend Resume",
    minLength: 3,
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @Length(3, 100, { message: "Title must be between 3 and 100 characters long" })
  title: string;

  @ApiProperty({
    type: "string",
    format: "binary",
    description: "Resume file (PDF or DOCX, max 5MB)",
  })
  file?: any;
}
