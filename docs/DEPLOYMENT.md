# Deployment Guide

> Source of truth: `.github/workflows/{ci,deploy}.yml`, `vercel.json`,
> `.env.example`, and `scripts/pre-deploy-check.ts`.

## Prerequisites

- Node.js 20+
- A Supabase project (Postgres + pgvector + Auth + Storage)
- A Google AI Studio API key (Gemini)
- (Optional) An Upstash Redis database for rate limiting
- (Optional) Langfuse keys for LLM observability

## 1. Supabase (Database + Auth + Storage)

1. Create a new Supabase project.
2. In the **SQL Editor**, run the schema setup. The canonical SQL lives in the
   **README.md** ("Database Setup" section): it enables pgvector, creates
   `profiles / documents / document_chunks / conversations / messages`, the
   `match_document_chunks` function, the `handle_new_user()` trigger, and the
   storage bucket policies.
   > ⚠️ Do **not** rely on `src/lib/db/schema.sql` — it is currently empty.
3. Apply the migrations in `supabase/migrations/` (e.g.
   `20260611_multi_document_chat.sql`) to enable multi-document chat
   (`conversations.document_ids` + `match_multiple_document_chunks`).
4. In **Storage**, create a private bucket named `documents` and apply the
   per-user folder policies from the README.
5. (Local dev) regenerate DB types after any schema change:
   ```bash
   npm run db:types
   ```

## 2. Environment Variables

Copy `.env.example` → `.env.local` (local) or set in the Vercel dashboard.

**Required** (build fails without these — see `scripts/pre-deploy-check.ts`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_API_KEY`
- `NEXT_PUBLIC_APP_URL`

**Optional** (features degrade gracefully if unset):

- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (rate limiting)
- `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST` (observability)

Run the pre-deploy sanity check before shipping:

```bash
npx tsx scripts/pre-deploy-check.ts
```

## 3. Vercel (Frontend + API)

1. Connect the GitHub repository to Vercel.
2. Configure all environment variables above in the Vercel project settings.
3. `vercel.json` already sets the framework, install/build commands, per-route
   `maxDuration` (60s for `/api/upload` and `/api/chat`), and API CORS headers
   (allow-origin = `NEXT_PUBLIC_APP_URL`).
4. Deploy.

## 4. CI/CD (GitHub Actions)

- **CI** (`.github/workflows/ci.yml`) runs on push to `main`/`develop` and PRs
  to `main`: TypeScript check → ESLint → Prettier check → Vitest (coverage) →
  build → Playwright E2E. Build/E2E jobs need the app env vars as GitHub
  Actions secrets.
- **Deploy** (`.github/workflows/deploy.yml`) runs on push to `main` (or manual
  `workflow_dispatch`) and deploys to Vercel with `--prod`.

**Required GitHub Actions secrets for deploy:**

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Plus the app env vars (as secrets) for the CI build/E2E jobs:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_API_KEY`, `UPSTASH_REDIS_REST_URL`,
`UPSTASH_REDIS_REST_TOKEN`, `NEXT_PUBLIC_APP_URL`, and `CODECOV_TOKEN`
(optional, for coverage upload).

## Multi-provider routing deployment

Configure only server-side variables in `docs/ADAPTIVE_AI_ROUTING.md`. Start Gemini-only, verify each account model independently, then add one provider at a time. Never use `NEXT_PUBLIC_*` credentials. Enable Cohere only after privacy and citation checks. Roll back with Gemini-only order, fallback off, max providers one, and reranking off.
