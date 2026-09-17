# Agy CLI operational handoff — SynapseDoc multi-provider routing

You are the operational executor, not the architect. Do not redesign the supplied provider layer.

Read `AGENTS.md` and repository instructions; use Graft first. Back up or commit, run `git status --short`, and stop if unrelated changes would be overwritten. Apply supplied files to exact paths; delete only explicitly obsolete `src/lib/ai/providers/groq-provider.ts`. Preserve `.env.local`. Never print, log, upload, or commit secrets. Install only explicitly required dependencies (none are added). Add credentials manually to local and Vercel, and verify no credential uses `NEXT_PUBLIC_*`.

Inspect every account's actual model catalog. Run package formatting, format check, type check, lint, tests, focused AI tests, `test:all`, build, and pre-deployment checks with real exit status. Test Gemini-only mode. Verify direct providers Groq, Cerebras, SambaNova, and Mistral independently; gateway providers OpenRouter and Hugging Face independently; and Cloudflare text independently. Test valid, missing, and invalid credentials and unknown/duplicate order values.

Confirm sequential calls, no racing, and at most two providers per request. Test retryable pre-token fallback, post-token interruption without continuation, permanent errors without fallback, cancellation, exactly one terminal SSE event, at most one assistant row, no duplicated tokens/citations, and original citation IDs/page mappings. Verify rate limiting remains one application action independent of provider fallback.

With real Upstash verify open, skip, cooldown, half-open lease, failed/successful probe, close, reset-aware cooldown, Redis degradation, bounded keys/TTL, and cleanup. Test Cohere disabled, success, fail-open, invalid/empty result, citation preservation, and candidate bounds. Verify Gemini profile `google:gemini-embedding-001:3072:v1`, existing-document search, foreign-profile rejection, and no ready status after embedding failure. Upload normal, scanned, corrupted PDFs and simulate empty OCR; verify native extraction first, Gemini-only OCR, validation, and the single-page mapping limit. Inspect safe logs/redaction and privacy/AI pages on mobile and desktop. Apply a migration only if supplied (none is). Perform bounded production verification only if explicitly authorized, inspect Vercel logs, and clean up all users/documents/storage/Redis/provider artifacts.

Stop and report evidence if credentials are unavailable; a model is absent; a provider API differs; unrelated work would be overwritten; dependency/migration safety is ambiguous; embeddings become incompatible; more than two providers are attempted; streaming concatenates content; multiple assistant rows appear; citations detach; rate limits are bypassed; gateway processing contradicts disclosure; secrets appear; tests contradict architecture; or cleanup cannot be confirmed.

Report exactly:

Changed

Commands run

Verified

Provider credentials and model availability

Direct-provider findings

Gateway-provider findings

Routing and attempt-bound findings

Streaming findings

Circuit-breaker and Upstash findings

Reranking findings

Embedding compatibility findings

OCR findings

Rate-limit findings

Logging and redaction findings

Privacy and disclosure findings

Database/migration findings

Production findings

Cleanup

Not verified

Risks

Rollback

Next step

Do not treat compilation, mocks, tests, or build as live-provider or production readiness.
