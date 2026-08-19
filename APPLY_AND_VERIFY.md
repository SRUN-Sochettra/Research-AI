# Apply and verify

Work from the supplied snapshot or manually resolve conflicts. Read `AGENTS.md`, use Graft first, commit/back up, and run `git status --short`. Stop if unrelated work would be overwritten. Copy each ZIP path to the same destination and delete only obsolete `src/lib/ai/providers/groq-provider.ts`. Preserve `.env.local`. No dependency or database migration is added.

Configure the server-only variables documented in `docs/ADAPTIVE_AI_ROUTING.md`; never use `NEXT_PUBLIC_*` for credentials. Gemini-only and immediate rollback:

```dotenv
AI_TEXT_PROVIDER_ORDER=gemini
AI_FALLBACK_ENABLED=false
AI_MAX_PROVIDERS_PER_REQUEST=1
AI_RERANK_ENABLED=false
```

Two-provider example: `AI_TEXT_PROVIDER_ORDER=gemini,groq`, fallback true, max providers 2. Hugging Face and Cloudflare are activated only by explicitly placing them in the order. To enable reranking, set `COHERE_API_KEY`, `COHERE_RERANK_MODEL`, `AI_RERANK_PROVIDER=cohere`, and `AI_RERANK_ENABLED=true`.

Run:

```bash
npm install
npm run format
npm run format:check
npm run type-check
npm run lint
npm run test
npm run test:all
npx vitest run tests/unit/ai
npm run build
npx tsx scripts/pre-deploy-check.ts
```

Verify each provider independently with fallback disabled after inspecting the account's actual model list. Then test two-provider pre-token fallback, permanent errors, post-token interruption, cancellation, at most two providers, one terminal SSE event, one assistant persistence, no duplicated tokens/citations, and rate-limit independence. Run `npx tsx scripts/verify-ai-health-upstash.ts`, verify open/skip/cooldown/half-open/probe/close and cleanup keys. Test Cohere disabled/success/fail-open/citation preservation/bounds. Verify `google:gemini-embedding-001:3072:v1`, existing-document search, and foreign-profile rejection. Test normal, scanned, corrupted, and empty-OCR PDFs; native extraction first and Gemini-only OCR. Inspect privacy pages, safe logs, and absence of secrets. Clean up users, documents, storage, Redis keys, and provider artifacts with direct evidence.

Full code rollback reverts supplied files and restores the previous Groq file. No database rollback applies.
