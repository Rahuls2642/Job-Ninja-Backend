import { IsNotEmpty, IsString, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RenameResumeDto {
  @ApiProperty({
    description: "The updated title of the resume",
    example: "Backend Resume",
    minLength: 3,
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @Length(3, 100, { message: "Title must be between 3 and 100 characters long" })
  title: string;
}
