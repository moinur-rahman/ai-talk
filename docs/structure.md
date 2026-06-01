# Project Structure

## Monorepo Layout

```
ai-talk/
├── client/          # Next.js frontend
├── server/          # NestJS backend
├── nginx/           # Reverse proxy config (nginx.conf)
├── docs/            # Project documentation
├── data/            # Docker volume data (postgres, redis, ollama, seaweedfs)
├── docker-compose.dev.yml
└── CLAUDE.md
```

## Server (`server/src/`)

- `common/` — config, constants, decorators
- `modules/` — feature modules:
  - `audio/` — transcription, TTS, WebRTC realtime sessions
  - `auth/` — authentication (strategies, guards, types, session serializer)
  - `chat/` — conversation, message, stream sub-modules
  - `document/` — document processing, embeddings, RAG
  - `file/` — file upload/management
  - `image-generation/` — OpenAI image generation
  - `llm/` — LLM provider integrations: `openai/`, `gemini/`, `ollama/`, `openrouter/`, `zai/`; shared `types/`; prompts, utils, reasoning constants
  - `model/` — AI model CRUD
  - `project/` — projects CRUD
  - `usage/` — usage tracking
  - `user/` — user management
- `providers/` — infrastructure: `prisma/`, `redis/`, `seaweedfs/`, `openai/`, `ollama/`, `openrouter/`, `zai/`, `ai-client.tokens`
- `generated/prisma/` — Prisma client output (at `server/generated/prisma/`)

## Client (`client/`)

- `app/` — Next.js App Router
  - `(protected)/`
    - `(workspace)/` — workspace layout
      - `(chat)/` — chat pages, `chat/[conversationId]/`, `new/`
      - `projects/` — `projects/`, `projects/[projectId]/`
      - `image-generation/`
      - `settings/` — `general/`, `data/`, `privacy/`
      - `usage/` — usage dashboard (`_components/`)
    - `admin/` — admin pages, `models/`
  - `(public)/` — `(auth)/` (login, register)
- `components/`
  - `admin/` — admin UI (model management)
  - `auth/` — login/register forms
  - `chat/` — `ChatHistory/`, `SendMessage/`, `ModelDropdown`, `ReasoningToggle`, `VoiceAgentPanel`
  - `common/` — `Sidebar/`, `ImageModal`, `SearchModal`
- `apis/` — API call definitions (axios instance)
- `services/` — client-side service layer (`chatApi`, `audioApi`, `fileApi`, `imageGenerationApi`, `modelApi`, `projectApi`, `usageApi`, `userApi`)
- `hooks/` — React hooks (`useVoiceAgent`)
- `redux/` — Redux store, hooks; `slices/` (`chatSlice`, `modelSlice`)
- `contexts/` — React contexts (`ChatContext`, `VoiceAgentContext`)
- `types/` — TypeScript types (`chat`, `speech`)
- `utils/` — utility helpers (`reasoningConfig`, `url`, `getCsrfTokenFromCookie`)
