# SynapseDoc — Next Session TODO

> Status as of 2026-07-28: **Deployed & working** at `synapsedoc.vercel.app`.
> Auth login works (created account with email-confirm OFF). Core RAG pipeline
> untested in prod yet. Five things to fix — ordered by effort/impact below.
>
> **Rule for this repo:** read `AGENTS.md` first, trust `src/lib/utils/constants.ts`
> over docs, run `npm run test:all && npx prettier --check . && npm run build`
> before claiming done.

---

## 0. First thing tomorrow — smoke-test the actual product

Before touching anything, confirm the RAG pipeline works in prod (never verified):

1. Log in → `/documents` → upload a small PDF.
2. Watch status go `processing → ready` (exercises `waitUntil` + Gemini embed +
   Supabase storage).
3. Open it → ask a question in chat → confirm you get a **streamed answer with
   page citations**.

If that works, the app is functionally done and everything below is polish.
If it doesn't, that's priority #1 — check Vercel function logs for the upload/chat
routes (Deployments → your deploy → Functions/Logs).

---

## 1. 🐛 BUG: signup still shows "check your inbox" after disabling confirmation

**Symptom:** email confirmation is OFF in Supabase, but the signup page still
routes to the "Check your inbox / confirmation" screen instead of logging the
user straight in.

**Root cause:** the signup handler has a hardcoded assumption that signup always
requires email confirmation. It's showing the confirmation UI regardless of what
Supabase actually returns.

**Where to look:** `src/app/(auth)/signup/page.tsx`

- After `supabase.auth.signUp(...)`, check the response. When confirmation is
  OFF, Supabase returns a **session** (`data.session !== null`) immediately.
  When ON, `data.session` is `null` and `data.user` exists but unconfirmed.
- Fix the branch: **if `data.session` exists → redirect to `/dashboard`**
  (router.push + router.refresh so the server picks up the cookie).
  **Only show "check your inbox" when `data.session === null`.**
- Verify the `/login` "Invalid login credentials" copy — consider detecting the
  unconfirmed-email case and showing a clearer message (Supabase returns a
  generic error, but you can special-case it).

**Acceptance:** new signup with confirmation OFF lands directly in `/dashboard`.

---

## 2. 🏷️ Rename "SynapseDoc" → "SynapseDoc"

Grep-and-replace, but hit ALL of these (don't miss the metadata/SEO ones):

- `src/lib/utils/constants.ts` → `APP_CONFIG.name` (source of truth — everything
  else should ideally import from here rather than hardcode).
- `src/app/layout.tsx` → `metadata.title` / `metadata.description` (browser tab +
  SEO + OpenGraph).
- `src/components/layout/header.tsx` → the "SynapseDoc" logo/wordmark text.
- Anywhere else: `grep -rn "SynapseDoc" src` and fix each.
- `package.json` `"name"` is `synapsedoc` — cosmetic, optional (affects nothing
  user-facing; changing it is fine but not required).
- Check `src/app/(auth)/*` pages for hardcoded "SynapseDoc" in headings.
- The brain 🧠 logo icon in the header — keep or swap, your call.

**Acceptance:** `grep -rn "SynapseDoc" src` returns nothing user-facing; tab
title + header + auth pages all say "SynapseDoc".

---

## 3. 🔴 Google login doesn't work

**Why:** the "Continue with Google" button exists in the UI, but Google OAuth is
almost certainly not configured in Supabase (and/or no Google Cloud OAuth client).

**Setup (three parts, all required):**

**3a. Google Cloud Console** → create OAuth 2.0 credentials

- APIs & Services → Credentials → Create OAuth client ID → Web application.
- **Authorized redirect URI** (critical — this is Supabase's callback, NOT your app):
  ```
  https://jfaevdbmgqvpuewdggql.supabase.co/auth/v1/callback
  ```
- Copy the **Client ID** and **Client Secret**.

**3b. Supabase** → Authentication → Sign In / Providers → **Google** → enable,
paste Client ID + Secret → Save.

**3c. Verify app-side redirect**

- Confirm the "Continue with Google" button calls
  `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: ... }})`
  with `redirectTo` = `https://synapsedoc.vercel.app/auth/callback`.
- Confirm `src/app/auth/callback/route.ts` exchanges the code for a session
  (it already exists — just verify it handles the OAuth code flow, not only
  email confirm).
- Supabase → URL Configuration → Redirect URLs must include
  `https://synapsedoc.vercel.app/**` (already added).

**Gotcha:** Google OAuth consent screen may be in "Testing" mode → only
allow-listed test users can log in. Either add your Gmail as a test user, or
publish the consent screen. For a portfolio, Testing mode + your email is fine.

**Acceptance:** clicking "Continue with Google" → Google consent → lands in
`/dashboard`.

---

## 4. ⚡ Actually use Redis (Upstash) for rate limiting

**Current state:** `src/lib/services/rate-limiter.ts` **silently no-ops** when
`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are absent — it returns
`{ success: true, limit: 999 }`. So right now there is **zero abuse protection**
in prod. Anyone can hammer `/api/chat` and `/api/upload` and burn your Gemini
quota.

**Fix:**

1. Create a free Upstash Redis DB → https://upstash.com (free tier is plenty).
2. Copy the REST URL + REST TOKEN.
3. Add both to **Vercel → Settings → Environment Variables** (Production, and
   Preview if you use previews):
   ```
   UPSTASH_REDIS_REST_URL   = https://xxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN = <token>
   ```
4. Redeploy.
5. **Verify it's actually on:** hit `/api/health` → `services.upstash` should be
   `true`. Then spam a request >10x/min and confirm you get a `429`.

No code change needed — the limiter activates automatically once the env vars
exist. (Optional hardening: make the limiter _throw/log loudly_ in production
when the vars are missing, so it can never silently no-op on prod again.)

---

## 5. 🎨 UI doesn't look "AI slop" — redesign pass

**The problem:** generic dark-glass template look, no identity, reads as
AI-generated boilerplate. Needs a deliberate visual language.

**Approach (do NOT just throw more effects at it):**

- **Pick a design direction first**, then commit. Given the name "SynapseDoc
  Research" there's room for either (a) serious/editorial research tool, or
  (b) a bit of personality/edge. Decide the vibe before touching CSS.
- **Typography before decoration:** set a real type scale, readable body
  (16px+), proper hierarchy. One strong family or a deliberate display/body
  pairing — no font soup.
- **Color strategy:** pick ONE committed accent, kill the default AI-purple
  gradient buttons (the `Sign in` button is textbook AI-slop purple→blue).
  Validate contrast in all states.
- **Layout:** rely on spacing, proximity, alignment before borders/shadows.
  The auth cards are floating generic boxes — give them intent.
- **State completeness:** loading skeletons that mirror real content, honest
  empty states (`/documents` with 0 docs), inline errors near the failing
  object, success feedback with a next step.
- **Kill fake/decorative junk:** no decorative status dots, fake metadata,
  purposeless glass. Every effect must earn its place — if removing it improves
  clarity, remove it.

**Screens that need the most work:**

- `/login` + `/signup` — first impression, currently most generic.
- `/dashboard` — the landing after auth.
- `/documents` — list + empty state + upload flow.
- `/chat/[documentId]` — the actual product; citations UX matters most here.

**Files:** `src/components/layout/*`, `src/components/documents/*`,
`src/components/chat/*`, `src/app/globals.css`, `src/app/(auth)/*`.

**Constraint:** keep it a focused-diff redesign; don't rewrite working logic,
just the presentation layer. Verify `npm run build` + visual QA on mobile
(you care about mobile-first / mid-range Android perf).

---

## Suggested order for tomorrow

1. **Smoke-test** (§0) — 5 min, confirm the product actually works.
2. **Signup bug** (§1) — small code fix, unblocks the core flow.
3. **Rename** (§2) — quick grep-replace, satisfying.
4. **Redis** (§4) — mostly dashboard clicks + redeploy, real security win.
5. **Google OAuth** (§3) — dashboard config, medium effort.
6. **UI redesign** (§5) — biggest chunk, save for a fresh focused block.

§1–4 are all quick. §5 is the real work — give it its own session.

---

## Loose ends carried over (non-blocking)

- Delete old misnamed `.prettiercc` if still present (real one is `.prettierrc`).
- `npm remove @google-cloud/vision` (unused after OCR simplification).
- Dedupe `tests/unit/agents/chunker.spec.ts` vs `chunker.test.ts`.
- Rotate the demo password (`Chettra12$$` was exposed in chat).
- `NEXT_PUBLIC_APP_URL` in Vercel must = `https://synapsedoc.vercel.app`
  (confirm it's not still the `xxxx` placeholder).
