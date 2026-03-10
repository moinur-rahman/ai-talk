import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateModelDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsBoolean()
  @IsOptional()
  hasReasoning?: boolean;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}
