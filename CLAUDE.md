# Project Instructions for Claude

## CRITICAL: Environment Variable Checklist

Whenever you add a new environment variable, you MUST update ALL of the following files — no exceptions:

1. `docker-compose.dev.yml` — add `- VAR_NAME=${VAR_NAME}` under the `server` service `environment` section
2. `server/src/common/config/config.ts` — add to `IConfig` interface and `config` object
3. Instruct the developer to manually add the variable to `.env` (default or empty value) and `.env.example` (placeholder/empty value) — Claude cannot edit these files

## Project Structure

`docs/structure.md` contains the project layout. Use it as a reference instead of searching the filesystem when you need to navigate the codebase.

## Code Style

- Always use curly braces for `if` conditions, even single-line ones.

## Running Commands

Always use npm scripts defined in the project's `package.json` instead of invoking tools directly (e.g. never `npx prisma`, `npx eslint`, etc.). Check the relevant `package.json` for the available scripts first.
