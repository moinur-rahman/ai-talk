# Project Structure

## Monorepo Layout

```
ai-talk/
├── client/          # Next.js frontend
├── server/          # NestJS backend
├── nginx/           # Reverse proxy config
├── docs/            # Project documentation
└── data/            # Docker volume data (postgres, redis, ollama, seaweedfs)
```

## Server (`server/src/`)

- `common/` — config, constants, decorators
- `modules/` — feature modules:
  - `audio/` — transcription, TTS, WebRTC realtime sessions
  - `auth/` — authentication (strategies, guards, DTOs)
  - `chat/` — conversation, message, stream sub-modules
  - `file/` — file upload/management
  - `image-generation/` — OpenAI image generation
  - `llm/` — LLM provider integrations: `openai/`, `gemini/`, `ollama/`, `openrouter/`, `zai/`; shared `types/`
  - `model/` — AI model CRUD
  - `project/` — projects CRUD
  - `user/` — user management
- `providers/` — infrastructure: `prisma/`, `redis/`, `seaweedfs/`
- `generated/prisma/` — Prisma client output (at `server/generated/prisma/`)

## Client (`client/`)

- `app/` — Next.js App Router
  - `(protected)/` — `(chat)/`, `(projects)/`, `admin/`, `image-generation/`, `settings/`
  - `(public)/` — `(auth)/`
- `components/`
  - `admin/` — admin UI
  - `auth/` — login/register forms
  - `chat/` — `ChatHistory/`, `SendMessage/`
  - `common/` — `Sidebar/` and shared components
  - `ui/` — shadcn/ui primitives
- `apis/` — API call definitions
- `services/` — client-side service layer
- `hooks/` — React hooks
- `redux/slices/` — Redux state slices
- `contexts/` — React contexts
- `types/` — TypeScript types
- `utils/` — utility helpers
