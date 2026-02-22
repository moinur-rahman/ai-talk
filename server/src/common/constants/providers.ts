export const SYSTEM_PROVIDERS = ['Ollama', 'OpenAI', 'OpenRouter'] as const;

export type ProviderName = (typeof SYSTEM_PROVIDERS)[number];

export const PROVIDER = {
  OLLAMA: 'ollama',
  OPENAI: 'openai',
  OPENROUTER: 'openrouter',
} as const;
