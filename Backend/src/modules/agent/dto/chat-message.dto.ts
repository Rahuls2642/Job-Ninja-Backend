import { IsString, IsUUID, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ChatMessageDto {
  @ApiProperty({ description: "User request message" })
  @IsString()
  message!: string;

  @ApiProperty({ description: "Conversation ID", required: false })
  @IsUUID()
  @IsOptional()
  conversationId?: string;
}
