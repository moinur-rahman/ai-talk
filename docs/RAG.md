# RAG Document Handling

## Overview

Implement provider-agnostic document handling for file attachments in chat. Previously, non-image documents (PDF, DOCX, etc.) were silently dropped for all providers except OpenAI. This feature adds a RAG (Retrieval-Augmented Generation) pipeline so documents work across all five providers.

## End-to-End Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PHASE 1 — FILE UPLOAD                              │
└─────────────────────────────────────────────────────────────────────────────┘

  User uploads file
        │
        ▼
  ┌─────────────┐     ┌──────────────────┐
  │  SeaweedFS  │◄────│  file.service.ts │
  │  (storage)  │     │  uploadFile()    │
  └─────────────┘     └────────┬─────────┘
                               │ save metadata
                               ▼
                       ┌───────────────┐
                       │  files table  │
                       │   (Prisma)    │
                       └───────┬───────┘
                               │ fire-and-forget (non-blocking)
                               ▼
                    isDocumentMimeType(mimeType)?
                       │               │
                      YES              NO (image)
                       │               │
                       ▼               ▼
              processFileForRag()    (skip — no RAG for images)
                       │
                       ▼
              extractText(buffer)
              pdf-parse / mammoth / xlsx / utf-8
                       │
                       ▼
              text.length ≥ 40,000 chars?
                 │               │
                YES              NO
                 │               │
                 ▼               ▼
          chunkText()       (skip — small doc,
          2000 chars,        no chunks stored)
          200 overlap
                 │
                 ▼
          embedBatch(chunks)
          Ollama / OpenAI
                 │
                 ▼
          INSERT INTO document_chunks
          (content, chunk_index, embedding::vector)
          pgvector stores 768-dim vectors


┌─────────────────────────────────────────────────────────────────────────────┐
│                       PHASE 2 — CHAT MESSAGE SEND                           │
└─────────────────────────────────────────────────────────────────────────────┘

  User sends message + attachment(s)
        │
        ▼
  chat-stream.service.ts  stream()
        │
        ├─── fetch attachment metadata from DB
        │
        ▼
  Pre-filter: documentAttachments = attachments excluding images
        │
        ▼
  buildRagContext(documentAttachments, query, provider)
        │
        ▼
  For each document attachment:
        │
        ▼
  isAlreadyProcessed(fileId)?
  (chunks exist in document_chunks?)
        │                    │
       YES                   NO
        │                    │
        ▼                    ▼
  retrieveRelevantChunks()   provider == OpenAI?
  embed query → cosine            │          │
  similarity search          YES (native)   NO
  top-3 chunks returned       │              │
        │                     ▼              ▼
        │         (nothing — passed     extractTextForSmallDoc()
        │          natively below)      download from SeaweedFS
        │                               extract full text inline
        ▼
  Combine: RAG chunks + inline texts
        │
        ▼
  ragContext == null?
        │               │
       YES              NO
        │               │
        ▼               ▼
  original prompt   "[Document Context]
  unchanged          {chunks/text}
                     ---
                     {original prompt}"
        │               │
        └───────┬────────┘
                ▼
  filterAttachmentsForProvider(attachments, provider, ragFileIds)
        │
        ├── OpenAI   → keep images + small docs (exclude large docs already in RAG)
        └── Others   → keep images only (docs already injected as text)
                │
                ▼
        Send to LLM provider
        (OpenAI / Gemini / OpenRouter / ZAI / Ollama)
```

---

## Decision Tree

```
For each non-image document attachment on a chat message:

  Are chunks already stored in pgvector? (file was large at upload time)
    YES → RAG: embed the query, retrieve top-3 relevant chunks, inject into message
    NO  → Does provider have native document support? (OpenAI only)
              YES → pass file directly (existing native behaviour, unchanged)
              NO  → inline inject: download file, extract full text, inject into message
```

Images always follow the existing path unchanged.

**"Large"** = extracted text > 10,000 tokens (~40,000 characters).

## Provider Support Matrix

| Provider | Images | Documents (before) | Documents (after) |
|----------|--------|-------------------|------------------|
| OpenAI | ✅ | ✅ native (base64) | ✅ native for small, RAG for large |
| Gemini | ✅ | ❌ silently skipped | ✅ RAG / inline inject |
| OpenRouter | ✅ | ❌ silently skipped | ✅ RAG / inline inject |
| ZAI | ✅ | ❌ silently skipped | ✅ RAG / inline inject |
| Ollama | ❌ | ❌ completely ignored | ✅ RAG / inline inject |

## Architecture

### Upload Time

```
File uploaded
    │
    ├─ Stored in SeaweedFS (unchanged)
    ├─ Metadata saved to DB (unchanged)
    └─ isDocumentMimeType()?
            YES → processFileForRag() [async, fire-and-forget]
                      │
                      ├─ extractText() → pdf-parse / mammoth / xlsx / utf-8
                      ├─ text.length < 40,000? → skip (small doc, no chunks stored)
                      └─ text.length ≥ 40,000? → chunk → embed → store in pgvector
```

### Chat Send Time

```
User sends message with document attachment
    │
    ├─ buildRagContext(attachments, query, provider)
    │       │
    │       ├─ isAlreadyProcessed(fileId)?
    │       │       YES → retrieveRelevantChunks() via pgvector cosine similarity
    │       │       NO + non-OpenAI → extractTextForSmallDoc() inline
    │       │       NO + OpenAI → nothing (native pass)
    │       └─ returns context string or null
    │
    ├─ If context → prepend to user message:
    │       "[Document Context]\n{chunks}\n\n---\n{original prompt}"
    │
    └─ filterAttachmentsForProvider(attachments, provider, ragFileIds)
            OpenAI   → pass images + small docs natively (exclude large RAG-processed docs)
            Others   → strip documents, keep images only
```

## Data Model

New table `document_chunks`:

```prisma
model DocumentChunk {
  id         String   @id @default(uuid()) @db.Uuid
  fileId     String   @map("file_id") @db.Uuid
  file       File     @relation(fields: [fileId], references: [id], onDelete: Cascade)
  content    String
  chunkIndex Int      @map("chunk_index")
  embedding  Unsupported("vector(768)")?
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz

  @@index([fileId])
  @@map("document_chunks")
}
```

- **Cascade delete**: chunks are automatically removed when the parent file is deleted.
- **Embedding column**: uses pgvector `vector(768)` — dimension must match the configured embedding model.
- pgvector extension required: `CREATE EXTENSION IF NOT EXISTS "vector"`.

## New Module: `server/src/modules/document/`

| File | Responsibility |
|------|---------------|
| `document-processor.service.ts` | Text extraction (PDF/DOCX/XLSX/text) and chunking |
| `embedding.service.ts` | Vector generation via OpenAI or Ollama |
| `rag.service.ts` | Orchestrates the full pipeline: process, store, retrieve |
| `document.module.ts` | NestJS module wiring |

## Chunking Strategy

- Chunk size: **2,000 characters**
- Overlap: **200 characters** (prevents context loss at chunk boundaries)
- Token estimate: `chars / 4` (rough approximation, no tokenizer dependency)

## Similarity Search

pgvector cosine similarity (`<=>` operator) via raw SQL (Prisma does not support the `vector` type natively):

```sql
SELECT content
FROM document_chunks
WHERE file_id = ANY($1::uuid[])
ORDER BY embedding <=> $2::vector
LIMIT $3
```

## Configuration

Four new environment variables — must be set in `.env`, `.env.example`, `docker-compose.dev.yml`, and `config.ts`:

| Variable | Default | Description |
|----------|---------|-------------|
| `EMBEDDING_PROVIDER` | `ollama` | `ollama` or `openai` |
| `EMBEDDING_MODEL` | `nomic-embed-text` | Model name passed to the provider |
| `EMBEDDING_DIMENSIONS` | `768` | Must match the model's output dimension |
| `LARGE_DOC_CHAR_THRESHOLD` | `40000` | Files above this are chunked and indexed |

## Embedding Dimensions

The `EMBEDDING_DIMENSIONS` env var, the `vector(N)` schema column, and the model's actual output **must all be the same number**. The model enforces its own fixed dimension — it cannot be changed.

| Model | Provider | Dimensions |
|-------|----------|-----------|
| `nomic-embed-text` | Ollama | 768 |
| `mxbai-embed-large` | Ollama | 1024 |
| `text-embedding-3-small` | OpenAI | 1536 |
| `text-embedding-3-large` | OpenAI | 3072 |

**Switching embedding models** requires updating all three (env var, schema, new migration) and re-indexing all existing document chunks, since vectors of different dimensions are mathematically incomparable.

## Supported Document Types

Extracted and processed for RAG:

- **PDF** — via `pdf-parse`
- **DOCX** — via `mammoth`
- **XLSX / XLS / CSV** — via `xlsx` (sheets converted to CSV text)
- **text/*** — all plain text, markdown, code files (read as UTF-8)
- **application/json**, **application/xml**, etc. — read as UTF-8

## Infrastructure

- PostgreSQL image changed from `postgres:16.4-alpine` to `pgvector/pgvector:pg16` to include the `vector` extension.
- New npm dependencies: `pdf-parse`, `mammoth`, `xlsx` (+ `@types/pdf-parse` dev).

## Files Changed

| File | Change |
|------|--------|
| `docker-compose.dev.yml` | Postgres image → `pgvector/pgvector:pg16`; new env vars added |
| `server/prisma/schema.prisma` | pgvector extension; `DocumentChunk` model; `File.documentChunks` relation |
| `server/src/common/config/config.ts` | 4 new embedding config fields |
| `.env` / `.env.example` | 4 new RAG env vars |
| `server/package.json` | `pdf-parse`, `mammoth`, `xlsx` dependencies |
| `server/src/modules/document/` | **New module** (4 files) |
| `server/src/modules/file/file.service.ts` | Fire-and-forget RAG trigger on upload; `uploadBuffer` renamed to `uploadGeneratedImage` |
| `server/src/modules/file/file.module.ts` | Imports `DocumentModule` |
| `server/src/modules/chat/stream/chat-stream.service.ts` | RAG context building + attachment filtering |
| `server/src/modules/chat/chat.module.ts` | Imports `DocumentModule` |
