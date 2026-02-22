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
  ollamaHost: string;
  titleGenerationProvider: string;
  titleGenerationModel: string;
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
  ollamaHost: getEnvVar('OLLAMA_HOST', 'http://localhost:11434'),
  titleGenerationProvider: getEnvVar('TITLE_GENERATION_PROVIDER', 'ollama'),
  titleGenerationModel: getEnvVar('TITLE_GENERATION_MODEL', 'llama3.2:1b'),
};

export default config;
