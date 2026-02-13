import { IsUUID } from 'class-validator';

export class ProviderParamsDto {
  @IsUUID()
  providerId: string;
}
