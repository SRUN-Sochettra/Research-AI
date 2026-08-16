# Agy CLI task — finish the SynapseDoc shippability pass

You're running in my local repo (Next.js 16 + Supabase RAG app). A patch set was
already applied that adds fixes to code files. Your job is the stuff that needs a
real shell, a package manager, and my Supabase project — things a static reviewer
couldn't do. **Read `AGENTS.md` first**, then work top-to-bottom. Don't fabricate
results: run the command, paste the real output, and if something fails, stop and
report rather than papering over it.

## Ground rules

- Read `AGENTS.md` and `src/lib/utils/constants.ts` before touching anything.
- Smallest safe change. Show me a diff for anything beyond the explicit deletes.
- After each step, report: **Command run / Real output / Pass|Fail / Next**.

## 1. Deletes (I could only create/overwrite, not remove)

- Delete the misnamed `./.prettiercc`. The correct `./.prettierrc` now exists —
  confirm Prettier picks it up (`npx prettier --check` should now load the
  tailwind plugin without a "no config found" fallback).
- There are duplicate chunker tests: `tests/unit/agents/chunker.spec.ts` and
  `tests/unit/agents/chunker.test.ts`. Open both. If one is a stale leftover,
  delete it; if they cover different cases, merge into `chunker.test.ts` and
  delete the `.spec.ts`. Report which and why.

## 2. Dependency hygiene

- After the OCR change, `@google-cloud/vision` should be unused. Grep the repo:
  `grep -rn "@google-cloud/vision" src`. If zero hits, `npm remove @google-cloud/vision`.
- Verify these are actually imported anywhere; if not, propose removal (don't
  remove without showing me the grep): `ai`, `html2pdf.js`, `langfuse`
  (note: `langfuse` tracing is currently a no-op shim in
  `src/lib/observability/langfuse-callback.ts` — confirm nothing else imports the
  real `langfuse` package before removing).
- `npm install` / `npm ci` and make sure the lockfile is clean.

## 3. Formatting + the real CI gate

Run, in order, and paste real output for each:

```
npx prettier --write .
npm run type-check
npm run lint
npm run test
npm run build
```

`npm run test:all` is the definition of done per AGENTS.md. The Prettier step
was the suspected CI blocker (config was ignored + mixed 2/4-space indentation),
so I especially want to see `prettier --check .` and `tsc --noEmit` go green.
If `tsc` complains about the removed `getCurrentChatModelName` /
`switchToNextModel` / `resetModelSelection` exports from `gemini.ts`, that means
some other caller still references the old globals — find it and migrate it to
`createChatModelSelector()` (see how `summarizer.ts` / `qa-agent.ts` now do it).

## 4. Verify live-DB RLS is ACTUALLY on (highest-risk item)

`src/lib/db/schema.sql` §6 enables RLS + policies, but the app only isolates
users if that was actually run against the live project. If the DB was created
from the _old_ README SQL, RLS is OFF and every user can read every document.
Check it (psql or Supabase SQL editor):

```sql
select relname, relrowsecurity
from pg_class
where relname in ('profiles','documents','document_chunks','conversations','messages');
```

Every row must show `relrowsecurity = true`. Also confirm policies exist:

```sql
select tablename, policyname from pg_policies where schemaname = 'public';
```

If RLS is off / policies missing, run the enablement + policy blocks from
`src/lib/db/schema.sql` §6 and §7 (storage). Report the before/after.

## 5. Optional hardening — multi-doc search RLS (needs a migration)

`searchMultipleSimilarChunks` (and the single-doc variant) call RPCs via the
service-role admin client, which bypasses RLS. It's safe _today_ because the
chat route pre-checks ownership of every `documentId`, but it's fragile. If you
want defense-in-depth, add a migration under `supabase/migrations/` that scopes
`match_multiple_document_chunks` to a `match_user_id uuid` param (join
`document_chunks → documents` and filter `documents.user_id = match_user_id`),
`npm run db:types`, then thread `userId` through the retriever + query. **Do the
migration + deploy FIRST, then the code** — never merge code that calls an RPC
signature that isn't live yet. Show me the migration before applying.

## 6. Cleanup docs

- `docs/ARCHITECTURE.md` is flagged stale in AGENTS.md (says `text-embedding-004`
  / `vector[768]`; reality is `gemini-embedding-001` / 3072). Fix it to match
  `constants.ts` + `schema.sql`.
- Sanity-check `AI_CONFIG.ocrModel` (`gemini-2.5-flash`) is a currently valid
  multimodal model name against the live API before relying on the OCR fallback.

## Report back as

Changed / Verified (commands you actually ran + output) / Risks / Next step.
Do not imply "done" without the green `test:all` + build output pasted.
