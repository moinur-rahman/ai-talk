import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  displayName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  workDescription?: string;

  @IsString()
  @IsOptional()
  customInstructions?: string;
}
