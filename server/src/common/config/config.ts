function getEnvVar(varName: string, defaultValue?: string): string {
  const value = process.env[varName] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Environment variable ${varName} is missing`);
  }
  return value;
}

interface IConfig {
  nodeEnv: string;
  port: number;
  domain: string;
  sessionTimeout: number;
  sessionSecret: string;
  redisHost: string;
  redisPort: number;
  redisPassword: string;
  databaseUrl: string;
  clientUrl: string;
  openaiApiKey: string;
  openrouterApiKey: string;
  zaiApiKey: string;
  geminiApiKey: string;
  ollamaHost: string;
  titleGenerationProvider: string;
  titleGenerationModel: string;
  embeddingProvider: string;
  embeddingModel: string;
  embeddingDimensions: number;
  largeDocCharThreshold: number;
  rateLimitWindowSeconds: number;
  rateLimitMaxRequests: number;
}

const config: IConfig = {
  nodeEnv: getEnvVar('NODE_ENV'),
  port: Number(getEnvVar('PORT')),
  domain: getEnvVar('DOMAIN'),
  sessionTimeout: Number(getEnvVar('SESSION_TIMEOUT')),
  sessionSecret: getEnvVar('SESSION_SECRET'),
  redisHost: getEnvVar('REDIS_HOST'),
  redisPort: Number(getEnvVar('REDIS_PORT')),
  redisPassword: getEnvVar('REDIS_PASSWORD'),
  databaseUrl: getEnvVar('DATABASE_URL'),
  clientUrl: getEnvVar('CLIENT_URL'),
  openaiApiKey: getEnvVar('OPENAI_API_KEY', ''),
  openrouterApiKey: getEnvVar('OPENROUTER_API_KEY', ''),
  zaiApiKey: getEnvVar('ZAI_API_KEY', ''),
  geminiApiKey: getEnvVar('GEMINI_API_KEY', ''),
  ollamaHost: getEnvVar('OLLAMA_HOST', 'http://localhost:11434'),
  titleGenerationProvider: getEnvVar('TITLE_GENERATION_PROVIDER', 'ollama'),
  titleGenerationModel: getEnvVar('TITLE_GENERATION_MODEL', 'llama3.2:1b'),
  embeddingProvider: getEnvVar('EMBEDDING_PROVIDER', 'ollama'),
  embeddingModel: getEnvVar('EMBEDDING_MODEL', 'nomic-embed-text'),
  embeddingDimensions: Number(getEnvVar('EMBEDDING_DIMENSIONS', '768')),
  largeDocCharThreshold: Number(getEnvVar('LARGE_DOC_CHAR_THRESHOLD', '40000')),
  rateLimitWindowSeconds: Number(getEnvVar('RATE_LIMIT_WINDOW_SECONDS', '60')),
  rateLimitMaxRequests: Number(getEnvVar('RATE_LIMIT_MAX_REQUESTS', '20')),
};

export default config;
