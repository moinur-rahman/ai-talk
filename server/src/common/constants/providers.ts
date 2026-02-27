export const SYSTEM_PROVIDERS = [
  'Ollama',
  'OpenAI',
  'OpenRouter',
  'Zai',
] as const;

export type ProviderName = (typeof SYSTEM_PROVIDERS)[number];

export const PROVIDER = {
  OLLAMA: 'ollama',
  OPENAI: 'openai',
  OPENROUTER: 'openrouter',
  ZAI: 'zai',
} as const;
