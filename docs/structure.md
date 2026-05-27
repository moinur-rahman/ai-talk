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
  - `user/` — user management
- `providers/` — infrastructure: `prisma/`, `redis/`, `seaweedfs/`
- `generated/prisma/` — Prisma client output (at `server/generated/prisma/`)

## Client (`client/`)

- `app/` — Next.js App Router
  - `(protected)/`
    - `(chat)/` — chat pages, `chat/[conversationId]/`, `new/`
    - `(projects)/` — `projects/`, `projects/[projectId]/`
    - `admin/` — admin pages, `models/`
    - `image-generation/`
    - `settings/` — `general/`, `data/`
  - `(public)/` — `(auth)/` (login, register)
- `components/`
  - `admin/` — admin UI (model management)
  - `auth/` — login/register forms
  - `chat/` — `ChatHistory/`, `SendMessage/`, `ModelDropdown`, `ReasoningToggle`, `VoiceAgentPanel`
  - `common/` — `Sidebar/`, `ImageModal`, `SearchModal`
- `apis/` — API call definitions (axios instance)
- `services/` — client-side service layer (`chatApi`, `audioApi`, `fileApi`, `imageGenerationApi`, `modelApi`, `projectApi`, `userApi`)
- `hooks/` — React hooks (`useVoiceAgent`)
- `redux/slices/` — Redux state slices (`chatSlice`, `modelSlice`)
- `contexts/` — React contexts (`ChatContext`, `VoiceAgentContext`)
- `types/` — TypeScript types
- `utils/` — utility helpers (`reasoningConfig`, `url`, `getCsrfTokenFromCookie`)
