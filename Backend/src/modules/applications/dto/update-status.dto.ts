import { IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum ApplicationStatus {
  DRAFT = "DRAFT",
  READY = "READY",
  SUBMITTED = "SUBMITTED",
  UNDER_REVIEW = "UNDER_REVIEW",
  INTERVIEW = "INTERVIEW",
  ASSESSMENT = "ASSESSMENT",
  FINAL_INTERVIEW = "FINAL_INTERVIEW",
  OFFER = "OFFER",
  HIRED = "HIRED",
  REJECTED = "REJECTED",
  WITHDRAWN = "WITHDRAWN",
}

export class UpdateStatusDto {
  @ApiProperty({ description: "Target status value to update the application", enum: ApplicationStatus, example: "INTERVIEW" })
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;
}
