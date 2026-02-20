import { IsString, MaxLength } from 'class-validator';

export class UpdateConversationTitleDto {
  @IsString()
  @MaxLength(50)
  title: string;
}
