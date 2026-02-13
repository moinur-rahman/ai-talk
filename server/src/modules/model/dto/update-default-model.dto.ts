import { IsUUID, IsNotEmpty } from 'class-validator';

export class UpdateDefaultModelDto {
  @IsUUID()
  @IsNotEmpty()
  modelId: string;

  @IsUUID()
  @IsNotEmpty()
  providerId: string;
}
