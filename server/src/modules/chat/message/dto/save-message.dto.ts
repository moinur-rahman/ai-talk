import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export enum SenderType {
  user = 'user',
  assistant = 'assistant',
}

export enum InputType {
  text = 'text',
  voice = 'voice',
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

  @IsOptional()
  @IsEnum(InputType)
  inputType?: InputType;

  @IsOptional()
  @IsInt()
  @Min(0)
  audioDurationMs?: number;

  @IsOptional()
  @IsUUID()
  parentMessageId?: string;

  @IsUUID()
  conversationId: string;

  @IsOptional()
  @IsUUID()
  modelId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  fileIds?: string[];

  @IsOptional()
  @IsString()
  openaiImageCallId?: string;
}
