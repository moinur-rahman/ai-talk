import { TokenUsage } from '../../llm/types/llm.types.js';

export interface RecordUsageDto {
  messageId: string;
  modelId: string;
  providerName: string;
  modelName: string;
  usage: TokenUsage;
}
