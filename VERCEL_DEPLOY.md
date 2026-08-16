# Deploying SynapseDoc to Vercel — repo-tailored checklist

Your code is already built for Vercel (`waitUntil` pipeline, `maxDuration: 60`,
`src/proxy.ts` middleware, `vercel.json`). This is the exact order that avoids
the two things that break first-time deploys of _this_ repo.

---

## Phase 0 — Pre-flight (local, 2 min)

```powershell
# You already did this and it's green, just re-confirm nothing drifted:
npm run test:all && npx prettier --check . && npm run build

# Sanity-check env locally (should say READY if .env.local is complete):
npx tsx --env-file=.env.local scripts/pre-deploy-check.ts
```

Also confirm the housekeeping deletes are done (or don't care — none block deploy):
old `.prettiercc` removed, `@google-cloud/vision` removed. Not required to ship.

---

## Phase 1 — Push to GitHub

```powershell
git add -A
git commit -m "chore: shippability fixes (RLS verified, chat fallback, prettier)"
git push origin main
```

⚠️ **Decision: pick ONE deploy trigger, or you'll get double deploys.**
Your repo has BOTH:

- `.github/workflows/deploy.yml` (deploys via `amondnet/vercel-action`), AND
- (about to add) Vercel's native Git integration.

If you connect Vercel's Git integration in Phase 2 (recommended — simplest),
**disable the GitHub Action** so they don't fight:

- Easiest: delete `.github/workflows/deploy.yml` (keep `ci.yml` — that's your
  test gate and is still useful).
- Or rename it and set `on: workflow_dispatch:` only.

---

## Phase 2 — Import the project to Vercel

1. https://vercel.com → **Add New → Project** → import your GitHub repo.
2. Framework preset auto-detects **Next.js**. Leave build/install as-is
   (`vercel.json` already sets `npm ci` + `npm run build`).
3. **DON'T click Deploy yet — add env vars first** (Environment Variables
   section on the import screen). Set each for **Production** (and Preview if
   you want PR previews to work):

**Required** (build passes without them but every route 500s at runtime):

```
NEXT_PUBLIC_SUPABASE_URL        = https://jfaevdbmgqvpuewdggql.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY   = <your anon key>
SUPABASE_SERVICE_ROLE_KEY       = <your service role key>   ← server-only, NEVER expose
GOOGLE_API_KEY                  = <your gemini key>
NEXT_PUBLIC_APP_URL             = https://PLACEHOLDER        ← fixed in Phase 4
```

**Optional** (features degrade gracefully if absent):

```
UPSTASH_REDIS_REST_URL          = <...>   ← WITHOUT this, rate limiting silently
UPSTASH_REDIS_REST_TOKEN        = <...>      no-ops (returns limit 999). Fine for
LANGFUSE_PUBLIC_KEY             = <...>      launch; add later to actually throttle.
LANGFUSE_SECRET_KEY             = <...>
LANGFUSE_HOST                   = https://cloud.langfuse.com
```

> 🔐 Double-check `SUPABASE_SERVICE_ROLE_KEY` is NOT prefixed `NEXT_PUBLIC_`.
> Anything `NEXT_PUBLIC_*` ships to the browser. The service key must stay
> server-side only.

4. Click **Deploy**. First build runs.

---

## Phase 3 — Grab your real URL

After the build finishes you get a URL like `https://synapsedoc-xxxx.vercel.app`.
Copy it. (Or add a custom domain now under Project → Settings → Domains, and use
that instead — cleaner, and you skip re-deploys later if you set it first.)

---

## Phase 4 — Fix the two things that depend on the real URL ⚠️

This is the step people miss. Auth and CORS both need the real URL.

**4a. Update `NEXT_PUBLIC_APP_URL` in Vercel**
Project → Settings → Environment Variables → edit `NEXT_PUBLIC_APP_URL` to your
real URL (no trailing slash), e.g. `https://synapsedoc-xxxx.vercel.app`.
Why it matters: `vercel.json` sets the CORS `Access-Control-Allow-Origin` header
to `$NEXT_PUBLIC_APP_URL`, and `constants.ts` uses it as `APP_CONFIG.url`.

**4b. Add the URL to Supabase Auth** (otherwise login/signup silently fails)
Supabase Dashboard → project `jfaevdbmgqvpuewdggql` → **Authentication → URL
Configuration**:

- **Site URL**: `https://synapsedoc-xxxx.vercel.app`
- **Redirect URLs** — add:
  ```
  https://synapsedoc-xxxx.vercel.app/**
  https://synapsedoc-xxxx.vercel.app/auth/callback
  ```

Your `src/app/auth/callback/route.ts` handles the OAuth/email-confirm exchange;
if the URL isn't allow-listed, Supabase rejects the redirect and login dies.

**4c. Redeploy** so the new `NEXT_PUBLIC_APP_URL` bakes in:
Vercel → Deployments → ⋯ on latest → **Redeploy** (or just `git commit --allow-empty -m "redeploy" && git push`).

---

## Phase 5 — Verify prod (the real smoke test)

1. **Health check** — visit `https://<your-url>/api/health`. Expect:

   ```json
   { "status": "healthy", "services": { "supabase": true, "gemini": true, "upstash": <true|false> } }
   ```

   `upstash: false` is fine if you skipped it. `supabase: false` → env var wrong.

2. **Auth** — go to `/signup`, create an account, confirm you land in `/dashboard`.
   (If email confirmation is on in Supabase, check the redirect works — that's 4b.)

3. **Full pipeline** — upload a small PDF at `/documents`, watch status go
   `processing → ready` (this exercises `waitUntil` + Gemini embed + Supabase
   storage), then open it and ask a question in chat. If you get a streamed
   answer with citations, the whole RAG path works in prod. 🎉

4. **Isolation still holds** — you already proved RLS with the anon-key test;
   nothing about deploy changes that. Good.

---

## Known prod gotchas specific to this app

- **`maxDuration: 60`** — a slow/large PDF ingest could brush the 60s function
  limit on a cold start. Hobby supports up to 300s if you need headroom; bump it
  in `vercel.json` + the route's `export const maxDuration` together. Your 10MB
  file cap keeps this mostly safe.
- **Rate limiting off without Upstash** — you can launch without it, but there's
  no abuse throttle until you add the two `UPSTASH_*` vars. Upstash has a free
  tier; wire it before sharing the link publicly.
- **CSP is locked down** in `next.config.ts` (`connect-src` allows only Supabase
  - `generativelanguage.googleapis.com`). If you ever add another external API
    (new font host, analytics, etc.), update the CSP or the browser blocks it.
- **Preview deployments** get a different `*.vercel.app` URL each time — auth
  won't work on previews unless you add a wildcard redirect URL in Supabase and
  set Preview-scoped env vars. Not needed for the main production deploy.

---

## TL;DR order of operations

Push → Import + env vars (with placeholder APP_URL) → Deploy → copy URL →
set real `NEXT_PUBLIC_APP_URL` + Supabase redirect URLs → redeploy →
hit `/api/health` → test signup + upload. Done.
