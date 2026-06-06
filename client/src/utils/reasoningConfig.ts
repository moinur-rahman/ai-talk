export interface ReasoningConfig {
  options: string[];
  default: string;
}

// Keyed by provider name (lowercased), matching the provider.name from the API
export const PROVIDER_REASONING_CONFIG: Record<string, ReasoningConfig> = {
  openai: {
    options: ['none', 'low', 'medium', 'high', 'xhigh'],
    default: 'medium',
  },
  gemini: { options: ['low', 'medium', 'high'], default: 'medium' },
};

export function getReasoningConfig(
  providerName: string,
): ReasoningConfig | null {
  return PROVIDER_REASONING_CONFIG[providerName.toLowerCase()] ?? null;
}
