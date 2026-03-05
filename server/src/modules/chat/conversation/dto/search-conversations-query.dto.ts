import { IsString, MaxLength, MinLength } from 'class-validator';

export class SearchConversationsQueryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  q: string;
}
