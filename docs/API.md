# API Documentation

> Source of truth: the route handlers in `src/app/api/**/route.ts` and the Zod
> schemas in `src/types/api.ts`. If this doc and the code disagree, the code wins.

## Conventions

- **Auth:** cookie-based Supabase session (JWT). All routes below require an
  authenticated user **except** `GET /api/health` and `GET /auth/callback`.
  Unauthenticated requests get `401`.
- **Rate limiting:** Upstash sliding window, keyed per user + action
  (e.g. `upload:<userId>`, `chat:<userId>`). Over the limit → `429` with
  `X-RateLimit-*` headers. If Upstash env vars are unset, rate limiting is a
  no-op (dev only).
- **Validation:** request bodies are validated with Zod (`uploadSchema`,
  `chatSchema`, `summarizeSchema` in `src/types/api.ts`).
- **Response envelope:** most JSON routes return
  `ApiResponse<T> = { success, data?, error? }`. **Exceptions:** `/api/chat`
  streams SSE and returns a bare `{ error }` on failure; `/api/health` returns
  its own status object; `/api/embed` is a stub (see below).

---

## Endpoints

### POST /api/upload

Uploads a PDF and kicks off the ingestion pipeline (parse → chunk → embed →
store → summarize). Long work runs after the response via `waitUntil()`.

- **Content-Type:** `multipart/form-data`
- **Field:** `file` (PDF, ≤ 10MB — see `LIMITS.maxFileSize`)
- **Limits:** ≤ 10 documents per user (`LIMITS.maxDocumentsPerUser`)
- **Returns:** `ApiResponse<UploadResponse>` → `{ documentId, status, message }`
- **Config:** `maxDuration = 60`

### POST /api/chat

RAG Q&A over one or more documents. Streams the answer token-by-token (SSE).

- **Body:** `{ message: string, documentId?: string, documentIds?: string[], conversationId?: string }`
  (`message` 1–5000 chars; IDs must be UUIDs — see `chatSchema`)
- **Behavior:** verifies the document(s) exist and are `ready`, retrieves top-k
  chunks via pgvector, generates with the Gemini fallback chain, persists the
  message + citations.
- **Returns:** `text/event-stream`. On error, bare JSON `{ error, details? }`.
- **Config:** `maxDuration = 60`

### POST /api/summarize

(Re)generates a summary for one document.

- **Body:** `{ documentId: string }` (UUID — see `summarizeSchema`)
- **Returns:** `ApiResponse<T>`

### GET /api/documents/[id]/status

Polling endpoint for ingestion progress.

- **Returns:** document status (`uploaded | processing | ready | error`).

### GET /api/documents/[id]/download

Returns a link/stream to the user's stored PDF (Supabase Storage, per-user
folder isolation).

### PATCH /api/documents/[id]

Update a document (e.g. rename). Body is the fields to change.

### DELETE /api/documents/[id]

Delete a document and its chunks (cascade via FK).

### GET /api/conversations/[id]/messages

List messages for a conversation (ordered).

### PATCH /api/conversations/[id]

Update a conversation (e.g. rename).

### DELETE /api/conversations/[id]

Delete a conversation and its messages (cascade via FK).

### POST /api/embed

> ⚠️ **Stub / not wired up.** Current handler returns
> `{ message: "Embeddings generated" }` with no auth and no logic. Real embedding
> happens inside the upload pipeline (`src/lib/agents/embedder.ts`), not here.
> Do not rely on this endpoint until it's implemented.

### GET /api/health

Public health check. No auth.

- **Returns:** `{ status: "healthy" | "degraded", timestamp, version, latencyMs, services: { supabase, gemini, upstash } }`
- **Status code:** `200` if all services healthy, `503` if degraded.
- **Config:** `dynamic = "force-dynamic"` (never cached).

### GET /auth/callback

Supabase auth callback (email confirmation / OAuth code exchange). Redirects
into the app on success.
