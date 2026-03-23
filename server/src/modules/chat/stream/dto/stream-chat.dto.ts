import { IsString, IsBoolean, IsOptional, IsArray } from 'class-validator';

export class StreamChatDto {
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
