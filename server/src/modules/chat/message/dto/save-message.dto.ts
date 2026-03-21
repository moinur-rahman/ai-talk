import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export enum SenderType {
  user = 'user',
  assistant = 'assistant',
}

export class SaveMessageDto {
  @IsOptional()
  @IsString()
  mainContent?: string;

  @IsOptional()
  @IsString()
  reasoningContent?: string;

  @IsEnum(SenderType)
  senderType: SenderType;

  @IsUUID()
  conversationId: string;

  @IsOptional()
  @IsUUID()
  lastProviderId?: string;

  @IsOptional()
  @IsUUID()
  lastModelId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  fileIds?: string[];

  @IsOptional()
  @IsString()
  openaiImageCallId?: string;
}
