<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Research AI — Agent Operating Guide

> Context for AI agents (and humans) working on this repo. Read this **first**, before touching code.
> When in doubt, trust the **running code and `src/lib/utils/constants.ts`** over prose in `README.md` / `docs/` — some docs are stale (see [Known Traps](#known-traps--do-not-trust-blindly)).

## 1. What this project is

**Research AI** — upload a PDF → an agent pipeline parses / chunks / embeds / summarizes it → user asks questions → RAG answers stream back with page-level citations.

Two pipelines, both in `src/lib/agents/`:

- **Ingestion pipeline** (`orchestrator.ts`): `parse → chunk → embed → store → summarize`
- **Q&A / RAG pipeline** (`qa-agent.ts` + `retriever.ts`): `reformulate query → embed → pgvector search → generate (streaming) → cite`

Single-user-scoped data; everything is isolated per user via Supabase RLS.

## 2. Stack (verified from `package.json`)

| Layer               | Tech                                                                               |
| ------------------- | ---------------------------------------------------------------------------------- |
| Framework           | **Next.js 16.2.12** (App Router, RSC, Turbopack dev), **React 19.2.4**             |
| Language            | TypeScript **strict** (`noUncheckedIndexedAccess`, `noUnusedLocals/Parameters` on) |
| AI                  | Google Gemini via `@langchain/google-genai`; LangChain.js v1                       |
| DB / Auth / Storage | Supabase (Postgres + **pgvector** + Auth + Storage)                                |
| Rate limiting       | Upstash Redis (`@upstash/ratelimit`, sliding window)                               |
| Observability       | Langfuse + structured JSON logging                                                 |
| UI                  | Tailwind v4, shadcn/ui + Radix, `sonner`, `next-themes`, `lucide-react`            |
| Tests               | Vitest (unit, jsdom) + Playwright (E2E)                                            |
| Deploy              | Vercel                                                                             |

## 3. Repo layout (what lives where)

```
src/
├── app/
│   ├── (auth)/            login / signup
│   ├── (dashboard)/       protected pages: documents, chat, compare, settings
│   └── api/               route handlers (upload, chat, documents, embed, summarize, health, conversations)
├── lib/
│   ├── agents/            THE AI CORE — pdf-parser, chunker, embedder, retriever,
│   │                      qa-agent, summarizer, query-reformulator, orchestrator
│   ├── ai/                gemini.ts (model clients + fallback chain), prompts.ts, embeddings.ts
│   ├── db/
│   │   ├── supabase/       client.ts (browser) · server.ts (RLS) · admin.ts (service role) · middleware.ts
│   │   └── queries/        documents.ts, conversations.ts, users.ts  ← all DB access goes through here
│   ├── services/          chat-service, document-service, rate-limiter
│   ├── observability/     langfuse, logger, metrics
│   └── utils/             constants.ts (SOURCE OF TRUTH for config), errors.ts, validators.ts, helpers.ts, api-helpers.ts
├── components/            chat/ · documents/ · layout/ · shared/ · ui/ (shadcn primitives)
├── hooks/                 use-auth, use-chat, use-documents, use-document-status
├── types/                 api.ts (Zod schemas + response types), database.ts (generated), agents.ts
└── proxy.ts               ⚠️ Next.js 16 middleware (renamed — see traps)
```

## 4. Commands

```bash
npm run dev            # turbopack dev server
npm run build          # production build
npm run type-check     # tsc --noEmit
npm run lint           # eslint
npm run format:check   # prettier --check
npm run test           # vitest run (unit)
npm run test:e2e       # playwright
npm run test:all       # type-check + lint + test  ← run before you claim "done"
npx tsx scripts/pre-deploy-check.ts   # env var / config sanity check
npm run db:types       # regenerate src/types/database.ts from local supabase
```

**Definition of done for any change:** `npm run test:all` passes, and Prettier is clean. CI (`.github/workflows/ci.yml`) enforces `tsc → eslint → prettier --check → vitest → build → playwright` in that order. If it won't pass CI, it isn't done.

## 5. Config source of truth — `src/lib/utils/constants.ts`

Do **not** hardcode these anywhere; import from constants:

- **Models:** chat `gemini-3.1-flash-lite`; embedding `gemini-embedding-001`
- **Embedding dimension: `3072`** (pgvector column is `vector(3072)`)
- **Chunking:** size `1000`, overlap `200`
- **Retrieval:** top-k `5`, similarity threshold `0.7`, max history `10`
- **Model fallback chain:** `3.1-flash-lite → 2.5-flash → 2.5-flash-lite → 2.0-flash-lite → 2.0-flash`
- **Limits:** file ≤ **10MB**, ≤ 10 docs/user, message ≤ 5000 chars, rate limit 10 req/min

Changing the embedding model or dimension is a **migration-level change** — the DB column, the `match_document_chunks` / `match_multiple_document_chunks` SQL functions, and all previously stored vectors must all agree. Do not touch casually.

## 6. Non-negotiable conventions

**Database access**

- All DB reads/writes go through `src/lib/db/queries/*`. Don't scatter raw Supabase calls in routes/components.
- **Two clients, different powers:**
  - `getSupabaseServerClient()` (`server.ts`) — RLS-enforced, user-scoped. **Default choice.**
  - `getSupabaseAdminClient()` (`admin.ts`) — **service role, BYPASSES RLS.** Server-only, never import into client code, and only for trusted pipeline writes (e.g. saving chunks, status updates). If you reach for admin, justify why RLS can't do it and keep the user-scoping check explicit.

**API routes** (pattern established in `src/app/api/upload/route.ts`)

1. Auth: `supabase.auth.getUser()` → 401 `UNAUTHORIZED` if absent
2. Rate limit: `checkRateLimit(`<action>:${user.id}`)` → 429 with `X-RateLimit-*` headers
3. Validate input with the **Zod schemas in `src/types/api.ts`** (`uploadSchema`, `chatSchema`, `summarizeSchema`)
4. Do work via a service / query module
5. Return the `ApiResponse<T>` envelope: `{ success, data?, error? }` — never a bare object

**Errors** — use the typed classes in `src/lib/utils/errors.ts` (`AuthenticationError`, `ValidationError`, `NotFoundError`, `RateLimitError`, `ExternalServiceError`). Convert with `toErrorResponse()` at the boundary. **Never leak internals** — unknown errors become a generic `INTERNAL_ERROR` 500.

**AI / LLM calls**

- Get models via `getChatModel()` / `getEmbeddingModel()` in `src/lib/ai/gemini.ts`. Don't instantiate `ChatGoogleGenerativeAI` directly.
- Respect the **fallback chain** via a **per-run `ChatModelSelector`** (`createChatModelSelector()` in `gemini.ts`): use `selector.current()` for `modelOverride`, `selector.next()` on a 429, `selector.reset()` at the start of a phase. **Do NOT use module-global model state** — the old `switchToNextModel()`/`resetModelSelection()` globals were removed because concurrent serverless runs raced on the shared index. Both the summarizer AND the QA/chat agent now implement fallback (chat can only fail over _before_ the first token is streamed). The pipeline is designed to **degrade, never crash** (summarizer falls back to first-chunk content if all summaries fail). Preserve that property.
- All prompts live in `src/lib/ai/prompts.ts` — add/edit there, don't inline prompt strings.

**Formatting** — Prettier (`.prettierrc`): 2-space, double quotes, semicolons, `printWidth` 80, `es5` trailing commas, tailwind plugin. Run `npm run format` before committing. (NB: the config was previously named `.prettiercc`, which Prettier does **not** recognize — it silently used defaults and skipped the tailwind class-sort plugin. If you still see a `.prettiercc`, delete it.)

## 7. Data model (see `docs/ERD.md` / README SQL block)

`profiles → documents → document_chunks` (with `embedding vector(3072)`) and `documents → conversations → messages`.

- `documents.status`: `uploaded | processing | ready | error` (note: **`uploaded`**, not `pending` — an older value that was renamed).
- Vector search via the `match_document_chunks` RPC (single doc) and `match_multiple_document_chunks` (multi-doc chat). Multi-doc requires the migration in `supabase/migrations/20260611_multi_document_chat.sql` + the `document_ids uuid[]` column.
- New schema changes → add a migration under `supabase/migrations/`, then `npm run db:types` to refresh `src/types/database.ts`.

## 8. Known traps — do NOT trust blindly

- **`docs/ARCHITECTURE.md` is STALE.** It says `text-embedding-004` and `vector[768]`. Reality (per `constants.ts` + README + schema) is **`gemini-embedding-001`, 3072 dims**. Trust the code. If you touch this area, fix the doc too.
- **`src/proxy.ts` is the middleware.** Next.js 16 renamed `middleware.ts` → the `proxy` export. Session refresh runs through `updateSession` in `src/lib/db/supabase/middleware.ts`. Don't recreate a `middleware.ts`.
- **`pdf-parse` is a server-external package** (`serverExternalPackages` in `next.config.ts`). It won't bundle for the client/edge — keep it in Node server routes only.
- **Rate limiting silently no-ops** if Upstash env vars are absent (returns success with limit 999). Fine for local dev; don't mistake "no 429s locally" for "rate limiting works."
- **Security headers + CSP** are defined in `next.config.ts`. If you add an external origin (new API, font, image host), you must update the CSP `connect-src`/`img-src` or requests will be blocked in prod.
- Vercel function limits: `upload` and `chat` routes get `maxDuration: 60` (`vercel.json` + route `export const maxDuration`). Long ingestion work uses `waitUntil()` from `@vercel/functions` to run after the response.
- `LangfuseHost` / Langfuse keys are optional — observability degrades gracefully if unset.

## 9. Environment

Required (`scripts/pre-deploy-check.ts` will fail the build without them):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_API_KEY`, `NEXT_PUBLIC_APP_URL`.
Optional (features degrade if missing): `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST`.
Copy `.env.example` → `.env.local`. **Never** commit secrets; never send the service role key to the client.

## 10. Working style expected here

- **Verify before claiming.** Read the actual file/route/schema — don't infer from filenames or this doc. Generated code is a proposal, not proof.
- **Smallest safe complete change.** Focused diffs for existing code; whole cohesive files for greenfield.
- **Security & privacy baseline:** server-side authz (RLS by default, object-level checks when using admin), Zod validation on every input, no PII in logs/URLs, safe error responses.
- **Report back as:** Changed / Verified (what you actually ran) / Risks / Next step. Don't imply "done" without evidence.

---

_Meta: this file is the primary agent context. Keep it in sync with `src/lib/utils/constants.ts` and the DB schema. When you fix a stale claim (e.g. the ARCHITECTURE.md embedding mismatch), update it here too._

<!-- graft:start -->

## Graft — repo context graph

This repo is indexed in `graft/`: small linked markdown nodes that explain each
system and carry exact file:line spans, kept in sync with the code through git.

For ANY task here — understanding how something works, finding where code lives,
or scoping a change — get context from the graph before grepping or opening
source files. Re-ask freely (it's cheap) and reuse literal identifiers you
already have (symbol, error string, file name) as the query. New to this repo?
Run `graft map` first — a token-budgeted orientation (dir clusters, hubs,
hotspots), no LLM, no key.

- Run `graft ask "<your question>" --source` → ranked nodes with the relevant
  code spans inlined (each hit's ≤8-line crux by default; `--full` for whole
  definitions when the crux isn't enough). Match the tool to the task shape:
  for understanding or editing, the top node IS the answer — cite its
  `covers:` file:line spans and edit straight from `--source`. For
  exhaustive tasks ("every occurrence / every caller of this pattern"), ranked
  results are top-N, not complete — run `graft grep "<literal>"` instead
  (exhaustive over indexed files, grouped by enclosing symbol), falling back
  to raw `grep -rn` only for unindexed files.
- `graft skeleton <file>` → every definition's signature + span, ~10× cheaper
  than reading the file; use it to skim an API surface.
- `graft callers <symbol>` gives precomputed, exact edges — who calls this.
  Add `--direction out` for what it calls, or `--depth N` to walk
  transitively for the full blast radius. For structural questions, skip
  ranking and use this directly.
- Or browse: `graft/INDEX.md` lists every node; follow the links.
- Monorepos and folders of multiple repos rank fairly across sub-projects —
  hits carry `[scope/]` labels naming which one they're from. Narrow with
  `graft ask "<task>" --in <scope>/` once you know where you're working.

If a returned span is truncated ("+N more lines"), open the file at that exact
range before finalizing. Only open source files when a node genuinely lacks a
needed detail, and then at the exact file:line the node points to — never
re-read whole files.

After big code changes, refresh the graph with `graft build` (deterministic,
no API key, $0).
<!-- graft:end -->
