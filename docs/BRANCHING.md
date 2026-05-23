# Conversation Branching

## Overview

Implement ChatGPT-style conversation branching — users can edit a past message or regenerate the last response to create a new branch, while previous branches remain navigable.

## How It Works

Each message can have multiple sibling versions. The conversation is a **tree**, not a list. `activeLeafMessageId` on the conversation is the entry point — walk up via `parentMessageId` to reconstruct the active path.

**Two entry points:**
- **Regenerate** — creates a new assistant message with the same parent user message
- **Edit & resend** — creates a new user message (sibling of the edited one), then streams a new assistant response

## Data Model Changes

- `Message` gets: `parentMessageId` (self-relation, nullable — `null` only for the first message)
- `Conversation` gets: `activeLeafMessageId` (points to the last sent/received message)
- Sibling order derived from `createdAt` — no branch index needed
- Both relations require explicit `@relation` names in Prisma to avoid ambiguity

## Stream API Changes

- Reuse existing `POST /chats/stream` — no new endpoint needed
- `parentMessageId` is optional — only sent for branching scenarios:

| Scenario | `parentMessageId` sent by frontend |
|---|---|
| First message | not sent |
| Normal send | not sent — backend reads `activeLeafMessageId` from conversation |
| Edit & resend | same `parentMessageId` as the message being edited |
| Regenerate | ID of the last user message |

- `isRegenerate: boolean` added to DTO — tells backend to fetch prompt from DB instead of DTO
- After streaming, `activeLeafMessageId` on the conversation is updated to the new assistant message ID

## Message Fetch API

Single endpoint: `GET /messages/:conversationId?switchToMessageId=xxx`

- Without `switchToMessageId` → backend uses `activeLeafMessageId` to determine the path
- With `switchToMessageId` → backend finds the leaf under that message (latest child recursion), returns that path

Each message in the response includes `siblingIds` (array of sibling IDs ordered by `createdAt`):
- `siblingIds.length` = total siblings
- `siblingIds.indexOf(currentMessageId)` = current position
- Used by frontend to render `< 2/3 >` and know which ID to send on arrow click

## Branch Navigation

- Navigation is **frontend-only state** — `activeLeafMessageId` is NOT updated on navigation
- On arrow click → frontend reads `siblingIds`, picks next/prev ID, calls `GET /messages/:conversationId?switchToMessageId=xxx`
- Backend finds the leaf under the target message (always picking latest child), returns the new active path
- On page reload → user lands back at `activeLeafMessageId` (last sent/received position), matching ChatGPT behaviour

## Frontend Changes

- Redux state tracks the active branch path per conversation (local only, resets on reload)
- Message component shows `< 2/3 >` navigator when `siblingIds.length > 1`
- "Edit" button on user messages opens inline edit
- "Regenerate" button on last assistant message
- Switching branches calls the message fetch endpoint with `switchToMessageId`, re-renders the conversation

## Constraints

- Attachments are tied to a specific message version
- Streaming responses always attach to the new branch version
- Branch history is preserved (never deleted)
- First message in a conversation always has `parentMessageId = null`
