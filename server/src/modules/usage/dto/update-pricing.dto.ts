import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdatePricingDto {
  @IsNumber()
  @Min(0)
  inputTokenPrice: number;

  @IsNumber()
  @Min(0)
  outputTokenPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reasoningTokenPrice?: number;
}
