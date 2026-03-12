import { IsIn, IsOptional, IsString } from 'class-validator';

export class GetProjectsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['recent', 'edited', 'created'])
  sort?: 'recent' | 'edited' | 'created';
}
