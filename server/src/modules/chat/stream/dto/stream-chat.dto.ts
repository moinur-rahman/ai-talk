import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  IsUUID,
} from 'class-validator';

export class StreamChatDto {
  @IsUUID()
  @IsOptional()
  conversationId?: string;

  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsString()
  prompt: string;

  @IsString()
  lastModelId: string;

  @IsBoolean()
  @IsOptional()
  enableReasoning?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fileIds?: string[];

  @IsBoolean()
  @IsOptional()
  webSearchEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  imageGenerationEnabled?: boolean;

  @IsString()
  @IsOptional()
  responseStyle?: string;
}
