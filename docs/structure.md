# Project Structure

## Monorepo Layout

```
ai-talk/
├── client/          # React + Vite frontend
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

Vite + React + React Router v7 SPA.

- `index.html` — Vite entry point
- `vite.config.ts` — Vite config (port 3000, `@/` alias → `src/`)
- `src/`
  - `main.tsx` — React root mount
  - `App.tsx` — React Router v7 route tree (BrowserRouter + Routes)
  - `index.css` — global styles, Tailwind theme tokens, Google Fonts
  - `guards/` — `ProtectedRoute.tsx`, `PublicRoute.tsx` (auth guards using RTK Query)
  - `layouts/` — `WorkspaceLayout.tsx`, `ChatLayout.tsx`, `AdminLayout.tsx`, `SettingsLayout.tsx`
  - `pages/`
    - `auth/` — `LoginPage.tsx`, `RegisterPage.tsx`
    - `workspace/` — `NewChatPage.tsx`, `ChatPage.tsx`, `ProjectsPage.tsx`, `ProjectDetailPage.tsx`, `ImageGenerationPage.tsx`, `UsagePage.tsx`
    - `workspace/usage/` — `DailyUsageChart.tsx`, `ModelBreakdownChart.tsx`, `UsageSummaryCards.tsx`, `PricingPanel.tsx`
    - `workspace/settings/` — `GeneralSettingsPage.tsx`, `DataSettingsPage.tsx`
    - `admin/` — `AdminModelsPage.tsx`
  - `components/`
    - `admin/` — admin UI (model management)
    - `auth/` — login/register forms
    - `chat/` — `ChatHistory/`, `SendMessage/`, `ModelDropdown`, `ReasoningToggle`, `VoiceAgentPanel`
    - `common/` — `Sidebar/`, `ImageModal`, `SearchModal`
  - `apis/` — API call definitions (axios instance)
  - `services/` — RTK Query service layer (`chatApi`, `audioApi`, `fileApi`, `imageGenerationApi`, `modelApi`, `projectApi`, `usageApi`, `userApi`)
  - `hooks/` — React hooks (`useVoiceAgent`)
  - `redux/` — Redux store, hooks; `slices/` (`chatSlice`, `modelSlice`)
  - `contexts/` — React contexts (`ChatContext`, `VoiceAgentContext`)
  - `types/` — TypeScript types (`chat`, `speech`)
  - `utils/` — utility helpers (`reasoningConfig`, `url`, `getCsrfTokenFromCookie`)
