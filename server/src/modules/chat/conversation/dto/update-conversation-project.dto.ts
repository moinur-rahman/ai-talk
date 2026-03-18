import { IsString, IsOptional } from 'class-validator';

export class UpdateConversationProjectDto {
  @IsOptional()
  @IsString()
  projectId?: string;
}
