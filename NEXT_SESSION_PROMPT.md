# Handoff Prompt — SynapseDoc (paste with the fresh repomix)

I'm continuing work on **SynapseDoc**, a RAG app I built and deployed
yesterday. I'm attaching a **repomix of the current repo** — treat that repo
dump as the single source of truth for all code. Anything in this prompt about
code structure is context from the last session and may be stale; **verify
against the actual repomix before acting, never assume a file's contents.**

## Who I am / how to work with me

- 2nd-year IT student, Phnom Penh. Comfortable + technical. Talk to me like a
  direct peer — no filler, no "great question," no corporate ceremony.
- Prioritize correctness and evidence over speed. Don't claim something works
  without proof. If a tool/read fails, say so — never fabricate file contents.
- Read `AGENTS.md` in the repo FIRST. Trust `src/lib/utils/constants.ts` over
  prose docs. Definition of done: `npm run test:all && npx prettier --check . &&
npm run build` all green.
- Deliver code as complete cohesive files for new work, focused diffs for edits.
  When handing me TSX, give it as a downloadable file (chat renderer corrupts
  JSX with expression attributes) and verify it compiles.

## Project state (as of 2026-07-28)

- **Stack:** Next.js 16.2.12 (App Router, Turbopack), React 19, TypeScript strict,
  Supabase (Postgres + pgvector + Auth + Storage), Google Gemini via LangChain.js
  v1, Upstash rate limiting, Tailwind v4 + shadcn/ui. Deploy: Vercel.
- **Live at:** `synapsedoc.vercel.app`
- **Supabase project ref:** `jfaevdbmgqvpuewdggql`
- **Verified working:** deploy is up; RLS is on and isolates users (proved via
  anon-key SELECT returning 0 rows); CI gate green; email/password login works
  after I recreated my account with email-confirmation turned OFF in Supabase.
- **NOT yet verified:** the actual PDF-upload → chat RAG pipeline in production.

## What I want to do this session (in priority order)

**0. Smoke-test the product first.** Before any changes, confirm the core flow
works in prod: upload a small PDF at `/documents` → status goes
`processing → ready` (this runs the `waitUntil` ingestion pipeline: parse →
chunk → embed → store → summarize) → open it → ask a question → get a streamed
answer with page citations. If it fails, that's priority #1 — help me read
Vercel function logs for the `/api/upload` and `/api/chat` routes.

**1. BUG — signup still shows the "check your inbox" confirmation screen** even
though I disabled email confirmation in Supabase. Expected: with confirmation
OFF, `supabase.auth.signUp()` returns a session immediately, so signup should
redirect straight to `/dashboard`. Fix the branch in the signup page
(`src/app/(auth)/signup/page.tsx` — verify path/name in repomix): show the
confirmation screen ONLY when `data.session === null`; otherwise push to
`/dashboard` + refresh. Check the repomix for how it currently handles the
signUp response.

**2. Rename "SynapseDoc" → "SynapseDoc"** everywhere user-facing. Grep the
repo. Hit at least: `constants.ts` `APP_CONFIG.name` (source of truth),
`app/layout.tsx` metadata (title/description/OG), the header wordmark, and the
auth pages. `grep -rn "SynapseDoc" src` should come back clean when done.

**3. Google OAuth doesn't work.** The "Continue with Google" button exists but
the provider isn't configured. Walk me through: (a) Google Cloud OAuth client
with redirect URI `https://jfaevdbmgqvpuewdggql.supabase.co/auth/v1/callback`,
(b) enabling Google in Supabase Auth providers, (c) verifying the app-side
`signInWithOAuth` call + `auth/callback` route handle the code exchange with
`redirectTo` = `https://synapsedoc.vercel.app/auth/callback`. Note the
consent-screen "Testing mode" gotcha.

**4. Actually enable Upstash Redis rate limiting.** Right now
`src/lib/services/rate-limiter.ts` silently no-ops when the env vars are absent,
so prod has ZERO abuse protection on `/api/chat` and `/api/upload`. I'll create
an Upstash DB and add `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` to
Vercel. Verify via `/api/health` (`services.upstash: true`) and a 429 test.
Optional: make the limiter fail loudly in production if the vars are missing so
it can't silently no-op again.

**5. UI redesign — it currently looks like generic AI-slop** (dark-glass
template, purple→blue gradient buttons, floating generic auth cards, no
identity). I want a deliberate visual language, direction-first. Apply my
frontend/design standards: typography and color strategy before decoration; kill
the AI-purple gradient; one committed accent; real hierarchy; complete state
matrix (loading skeletons mirroring real content, honest empty states, inline
errors near the failing object, success with a next step); no decorative junk.
Priority screens: `/login`, `/signup`, `/dashboard`, `/documents` (+ empty
state), `/chat/[documentId]` (citations UX matters most). Focused presentation-
layer diffs — don't rewrite working logic. Mobile-first, mid-range Android perf.
Before writing code, propose 2–3 concrete design directions and let me pick one.

## Suggested order

0 (smoke-test) → 1 (signup bug) → 2 (rename) → 4 (Redis) → 3 (Google OAuth) →
5 (UI redesign, its own focused block). 1–4 are quick; 5 is the real work.

## Non-blocking cleanup (do if convenient)

Delete stale `.prettiercc` if the real `.prettierrc` exists; `npm remove
@google-cloud/vision` (unused after OCR simplification — confirm no imports
first); dedupe `chunker.spec.ts` vs `chunker.test.ts`; confirm Vercel
`NEXT_PUBLIC_APP_URL` = `https://synapsedoc.vercel.app` (not the old `xxxx`
placeholder).

**Start by reading `AGENTS.md` and the relevant files from the attached repomix,
confirm the current state of items 0–1, then tell me your plan before making
changes.**
