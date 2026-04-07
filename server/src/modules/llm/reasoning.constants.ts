export const PROVIDER_REASONING_OPTIONS: Record<string, string[]> = {
  openai: ['none', 'low', 'medium', 'high', 'xhigh'],
  gemini: ['low', 'medium', 'high'],
};

export const ALL_REASONING_LEVELS: string[] = [
  ...new Set(Object.values(PROVIDER_REASONING_OPTIONS).flat()),
];

export function getProviderReasoningOptions(
  providerName: string,
): string[] | null {
  return PROVIDER_REASONING_OPTIONS[providerName.toLowerCase()] ?? null;
}
