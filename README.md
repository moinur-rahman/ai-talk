# ai-talk

A self-hosted, production-quality multi-model AI chat application. Supports multiple LLM providers, file attachments, image generation, voice, and project-based conversation organization — a fully controlled alternative to commercial chat interfaces.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | NestJS (TypeScript) |
| Frontend | Next.js (App Router), Tailwind CSS, shadcn/ui |
| Database | PostgreSQL via Prisma ORM |
| Vector Search | pgvector (PostgreSQL extension) |
| State / Data Fetching | Redux Toolkit + RTK Query |
| Object Storage | SeaweedFS |
| Caching / Rate Limiting | Redis |
| Infrastructure | Docker Compose, Nginx reverse proxy |

---

## Project Structure

```
ai-talk/
├── client/          # Next.js frontend
├── server/          # NestJS backend
├── nginx/           # Reverse proxy config
├── docs/            # Project documentation
└── data/            # Docker volume data (postgres, redis, ollama, seaweedfs)
```

---

## Features

| Feature | Status |
|---|---|
| Multi-provider chat (OpenAI, Gemini, Ollama, OpenRouter, Zai) | ✅ |
| Token streaming with per-provider reasoning/thinking support | ✅ |
| File attachments (images, documents, spreadsheets, code) | ✅ |
| Project-based conversations with custom instructions | ✅ |
| OpenAI image generation (in-chat + standalone) | ✅ |
| Gemini image generation | ✅ |
| Voice input (transcription) + TTS | ✅ |
| WebRTC Realtime voice sessions | ✅ |
| Admin model management + live sync | ✅ |
| Message branching and regeneration | ✅ |
| RAG pipeline with pgvector (PDF, DOCX, XLSX, code) | ✅ |
| Token usage tracking + per-model cost analytics dashboard | ✅ |
| Web search tool use (OpenAI) | ✅ |
| Redis sliding window rate limiting on chat stream | ✅ |

---

## Backend Architecture

NestJS module-based structure under `server/src/modules/`:

**`auth/`** — Session-based authentication with guards (`AdminGuard`), strategies, and a `@CurrentUser` decorator.

**`chat/`** — Three sub-modules:
- `conversation/` — CRUD, project assignment, infinite-scroll pagination
- `message/` — Save/retrieve messages with file attachments inside Prisma transactions
- `stream/` — SSE-based token streaming orchestration

**`llm/`** — Provider abstraction layer. `LlmService` dispatches to five provider services via a unified `streamResponse(request, onToken)` interface:
- **OpenAI** — Responses API with `previous_response_id`, native image generation tool calls, `openaiImageCallId` persistence for multi-turn image context
- **Gemini** — `@google/genai` SDK, `thinkingLevel` support, inline base64 image attachments
- **Ollama** — Local models, `think` flag for reasoning
- **OpenRouter** — OpenAI-compatible client, reasoning via `{ effort: 'low' }`
- **Zai** — Additional provider

**`model/`** — Admin CRUD for models and providers. Auto-seeds providers on bootstrap. `syncModels()` fetches live model lists from each provider's API.

**`project/`** — Full CRUD with search and sort. The `instructions` field is injected as a system prompt into every conversation within a project.

**`image-generation/`** — Dedicated OpenAI image generation endpoint (`gpt-image-1`).

**`audio/`** — Transcription (`gpt-4o-mini-transcribe`), TTS (`gpt-4o-mini-tts`), WebRTC Realtime API sessions via a sideband WebSocket listener.

**`document/`** — RAG pipeline: multi-format ingestion (PDF via `pdf-parse`, DOCX via `mammoth`, XLSX/CSV via `xlsx`, plain text/code), 2000-char overlapping chunking, OpenAI/OpenRouter/Ollama embedding generation stored as pgvector, cosine similarity retrieval. Small documents are injected as full text; large documents go through chunked RAG.

**`file/`** — Upload and management backed by SeaweedFS. Tracks `ragStatus` per file (`processing → completed / skipped / failed`).

**`usage/`** — Records input/output/reasoning token counts and costs per message (`MessageUsage`). Exposes dashboard summary, per-model breakdown, and daily trend endpoints. Admin endpoints for managing `ModelPricing` (input/output/reasoning rates per 1M tokens).

**`user/`** — User profile, custom instructions, work description.

**`providers/`** — Infrastructure singletons: `prisma/`, `redis/`, `seaweedfs/`.

---

## Database Schema

```
User ──→ Project[] ──→ Conversation[]
User ──→ Conversation[] ──→ Message[] ──→ MessageAttachment[]
Message ──→ Model (nullable, assistant messages only)
Message ──→ MessageUsage (token counts + costs)
Model ──→ Provider
Model ──→ ModelPricing (input/output/reasoning rates)
User ──→ File[] ──→ DocumentChunk[] (pgvector embeddings)
MessageAttachment ──→ File
```

Key columns:
- `Message.openaiImageCallId` — stores OpenAI's `image_generation_call.id` for passing generated images in subsequent turns
- `Message.reasoningContent` — separate column for chain-of-thought / thinking tokens
- `Message.inputType` — `text | voice` with `audioDurationMs`
- `Conversation.activeLeafMessageId` — pointer to the current active branch tip
- `Conversation.projectId` — nullable, `SetNull` on project delete
- `File.ragStatus` — `processing | completed | skipped | failed`
- `DocumentChunk.embedding` — pgvector column; `embeddingModel` tracks which model produced it
- `MessageUsage.*` — `inputTokens`, `outputTokens`, `reasoningTokens`, `totalCost` (Decimal for precision)
- `ModelPricing.*` — `inputTokenPrice`, `outputTokenPrice`, `reasoningTokenPrice` per 1M tokens

---

## Frontend Architecture

Next.js App Router with route groups under `client/app/`:

| Route | Description |
|---|---|
| `(public)/auth/` | Login / register |
| `(protected)/(workspace)/(chat)/` | Main chat interface |
| `(protected)/(workspace)/projects/` | Project list and project detail |
| `(protected)/(workspace)/image-generation/` | Standalone image generation UI |
| `(protected)/(workspace)/usage/` | Token usage and cost analytics dashboard |
| `(protected)/(workspace)/settings/` | User preferences |
| `(protected)/admin/` | Model management (enable/disable, sync, create) |

**Data layer:** RTK Query service files (`chatApi`, `projectApi`, `modelApi`) with `providesTags`/`invalidatesTags` cache invalidation and infinite query pagination for conversation lists.

**UI:** shadcn/ui primitives with a custom dark-themed design token system (`surface-dim`, `surface-raised`, `accent`, `muted`, etc.), context menus with portal rendering, sonner toasts.

---

## Architectural Decisions

**SSE for streaming** — LLM tokens are streamed server → client via Server-Sent Events. Not WebSockets.

**Native `ws` for WebRTC sideband** — The OpenAI Realtime API sideband channel uses a raw WebSocket for binary audio proxying. Socket.IO is intentionally avoided here.

**Database as source of truth** — OpenAI server-side state (response IDs, file TTLs) has expiry windows and is never relied upon as primary storage. PostgreSQL via Prisma is authoritative.

**Provider abstraction** — All five LLM providers implement the same `streamResponse(request, onToken)` interface. The chat stream service is fully provider-agnostic.

**System prompt composition** — Per-user `customInstructions` + per-project `instructions` are assembled and injected on every LLM request.

**Admin model sync** — Models are not hardcoded. Admins trigger a live sync from each provider's API, then toggle enable/disable per model.

---

## Infrastructure

```
Nginx (reverse proxy)
  ├── /api  →  NestJS   (port 3001)
  └── /     →  Next.js  (port 3000)

Docker Compose volumes:
  data/postgres
  data/redis
  data/ollama
  data/seaweedfs
```

---

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 20+

### Setup

```bash
# Copy environment file and fill in values
cp .env.example .env

# Start all services
docker compose -f docker-compose.dev.yml up
```

### Environment Variables

See `.env.example` for all required variables. Key ones:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `OPENAI_API_KEY` | OpenAI API key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `OLLAMA_HOST` | Ollama host URL |
| `SEAWEEDFS_*` | SeaweedFS connection config |
| `REDIS_URL` | Redis connection string |

> **Note:** Whenever a new environment variable is added, it must be updated in `.env`, `.env.example`, `docker-compose.dev.yml`, and `server/src/common/config/config.ts`.

---

## Development Notes

- Always use npm scripts defined in `package.json` — never invoke `npx prisma`, `npx eslint`, etc. directly.
- Always use curly braces for `if` conditions, even single-line ones.
- `docs/structure.md` is the canonical reference for the codebase layout.
