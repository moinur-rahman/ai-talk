# Project Instructions for Claude

## CRITICAL: Environment Variable Checklist

Whenever you add a new environment variable, you MUST update ALL of the following files — no exceptions:

1. `.env` — add with a default or empty value
2. `.env.example` — add with a placeholder/empty value
3. `docker-compose.dev.yml` — add `- VAR_NAME=${VAR_NAME}` under the `server` service `environment` section
4. `server/src/common/config/config.ts` — add to `IConfig` interface and `config` object

## Project Structure

`docs/structure.md` contains the project layout. Use it as a reference instead of searching the filesystem when you need to navigate the codebase.

## Running Commands

Always use npm scripts defined in the project's `package.json` instead of invoking tools directly (e.g. never `npx prisma`, `npx eslint`, etc.). Check the relevant `package.json` for the available scripts first.
