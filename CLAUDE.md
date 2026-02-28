# Project Instructions for Claude

## CRITICAL: Environment Variable Checklist

Whenever you add a new environment variable, you MUST update ALL of the following files — no exceptions:

1. `.env` — add with a default or empty value
2. `.env.example` — add with a placeholder/empty value
3. `docker-compose.dev.yml` — add `- VAR_NAME=${VAR_NAME}` under the `server` service `environment` section
4. `server/src/common/config/config.ts` — add to `IConfig` interface and `config` object

## Adding a New LLM Provider

When adding a new LLM provider, update all of the following:

1. Create `server/src/modules/llm/<name>/<name>.service.ts`
2. `server/src/common/constants/providers.ts` — add to `SYSTEM_PROVIDERS` and `PROVIDER`
3. `server/src/modules/llm/llm.module.ts` — register in `providers` and `exports`
4. `server/src/modules/llm/llm.service.ts` — add cases in `streamResponse`, `stopStream`, `generateConversationTitle`
5. `server/src/modules/model/model.service.ts` — add case in `fetchModelsForProvider`
6. Follow the env var checklist above for any new API key
