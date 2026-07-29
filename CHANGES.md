# Research AI — Shippability Fix Patch Set

Drop-in replacements. Every path here mirrors the repo layout — unzip **at the
repo root** and let it overwrite. Then run the agy prompt (`AGY_PROMPT.md`) for
the destructive/local/DB steps I can't do from a static read.

> ⚠️ I could not execute `tsc`/`eslint`/`prettier`/`vitest`/`next build` in my
> environment (no `node_modules`). These edits are verified by static reading
> only. Your real go/no-go is `npm run test:all && npx prettier --check .`
> locally — see the agy prompt.

---

## Files in this patch

| File                                           | Change                                                                                                                        | Fixes                                                                                                             |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `.prettierrc`                                  | **New**, correctly named                                                                                                      | Blocker #1 (config was `.prettiercc`, silently ignored → tailwind sort plugin never loaded, wrong trailing-comma) |
| `src/lib/ai/gemini.ts`                         | Replaced module-global model index with a per-invocation `ChatModelSelector`                                                  | #4 concurrency race between warm-instance pipeline runs                                                           |
| `src/lib/agents/qa-agent.ts`                   | Added model fallback to the streaming chat path (fails over only before first token)                                          | #3 chat had no fallback despite AGENTS.md claiming "degrade, never crash"                                         |
| `src/lib/agents/summarizer.ts`                 | Uses the new per-run selector instead of the removed globals                                                                  | follows from #4                                                                                                   |
| `src/lib/agents/pdf-parser.ts`                 | Removed the dead Google Vision path (no creds in env contract → could only throw); OCR fallback now uses `AI_CONFIG.ocrModel` | #6 broken OCR + hardcoded retired model line                                                                      |
| `src/lib/utils/constants.ts`                   | Added `ocrModel`                                                                                                              | supports #6                                                                                                       |
| `src/app/api/documents/[id]/route.ts`          | Added `checkRateLimit` to DELETE + PATCH; auth-before-parse; 2-space                                                          | rate-limit convention gap                                                                                         |
| `src/app/api/documents/[id]/download/route.ts` | Added `checkRateLimit`; 2-space                                                                                               | rate-limit convention gap                                                                                         |
| `package.json`                                 | `lint:fix`: `next lint --fix` → `eslint . --fix`                                                                              | `next lint` removed in Next 16                                                                                    |
| `AGENTS.md`                                    | Next version 16.2.6→16.2.12; rewrote the fallback-chain convention; noted prettier rename                                     | doc drift / claim-reality gaps                                                                                    |

## What I deliberately did NOT change (see AGY_PROMPT.md)

- **Deleting** the old `.prettiercc` and the duplicate `chunker.spec.ts` — I can
  create/overwrite but not delete from your repo.
- **Removing unused deps** (`@google-cloud/vision` now unused after the OCR
  change; verify `ai`, `html2pdf.js`, `langfuse`) — needs `npm` + your judgment.
- **Multi-doc RPC hardening** (`searchMultipleSimilarChunks` bypasses RLS) —
  that's a **migration** (new RPC signature). Shipping the code change without
  deploying the SQL first would break prod, so I left it as a guided task.
- **Verifying live-DB RLS is actually enabled** — that's a query against your
  Supabase project, not something in the repo.
- Running `npm run format` to normalize the rest of the mixed-indentation files.
