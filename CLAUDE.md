# Project Instructions for Claude

## CRITICAL: Environment Variable Checklist

Whenever you add a new environment variable, you MUST update ALL of the following files — no exceptions:

1. `.env` — add with a default or empty value
2. `.env.example` — add with a placeholder/empty value
3. `docker-compose.dev.yml` — add `- VAR_NAME=${VAR_NAME}` under the `server` service `environment` section
4. `server/src/common/config/config.ts` — add to `IConfig` interface and `config` object

## Running Commands

Always use npm scripts defined in the project's `package.json` instead of invoking tools directly (e.g. never `npx prisma`, `npx eslint`, etc.). Check the relevant `package.json` for the available scripts first.

Common server scripts (run from `server/`):

- `npm run prisma:migrate` — run migrations
- `npm run prisma:generate` — regenerate the Prisma client
- `npm run prisma:studio` — open Prisma Studio
- `npm run lint:check` — check for lint errors without fixing
- `npm run lint` — lint and auto-fix

## Adding a New LLM Provider

When adding a new LLM provider, update all of the following:

1. Create `server/src/modules/llm/<name>/<name>.service.ts`
2. `server/src/common/constants/providers.ts` — add to `SYSTEM_PROVIDERS` and `PROVIDER`
3. `server/src/modules/llm/llm.module.ts` — register in `providers` and `exports`
4. `server/src/modules/llm/llm.service.ts` — add cases in `streamResponse`, `stopStream`, `generateConversationTitle`
5. `server/src/modules/model/model.service.ts` — add case in `fetchModelsForProvider`
6. Follow the env var checklist above for any new API key
