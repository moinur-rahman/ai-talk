export const SYSTEM_PROVIDERS = ['Ollama', 'OpenAI', 'OpenRouter'] as const;

export type ProviderName = (typeof SYSTEM_PROVIDERS)[number];
