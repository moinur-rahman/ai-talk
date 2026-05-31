import { IsOptional, IsDateString } from 'class-validator';

export class UsageQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
