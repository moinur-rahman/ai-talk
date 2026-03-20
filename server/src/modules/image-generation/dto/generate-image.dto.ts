import { IsEnum, IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GenerateImageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  prompt: string;

  @IsEnum(['gpt-image-1', 'gpt-image-1-mini'])
  model: 'gpt-image-1' | 'gpt-image-1-mini';

  @IsIn(['1024x1024', '1536x1024', '1024x1536'])
  size: '1024x1024' | '1536x1024' | '1024x1536';

  @IsEnum(['low', 'medium', 'high'])
  quality: 'low' | 'medium' | 'high';
}
