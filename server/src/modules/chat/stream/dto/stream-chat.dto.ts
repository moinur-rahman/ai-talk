import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  IsUUID,
  IsIn,
} from 'class-validator';
import { ALL_REASONING_LEVELS } from '../../../llm/reasoning.constants.js';

export class StreamChatDto {
  @IsString()
  prompt: string;

  @IsUUID()
  @IsOptional()
  branchFromMessageId?: string;

  @IsUUID()
  @IsOptional()
  conversationId?: string;

  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsString()
  lastModelId: string;

  @IsIn(ALL_REASONING_LEVELS)
  @IsOptional()
  reasoningLevel?: string | null;

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
