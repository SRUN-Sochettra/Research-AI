# Agy CLI — apply and verify adaptive AI routing

You are the operational executor, not the architect. Read `AGENTS.md` and repository instructions first. Back up or commit the current state, then inspect `git status --short`. Stop if unrelated uncommitted changes would be overwritten.

Apply the supplied files carefully. No new dependency is intended; do not add one. Preserve `.env.local`; never print or commit secrets. Add required local and Vercel variables manually without exposing values: optional `GROQ_API_KEY`, `AI_TEXT_PROVIDER_ORDER=gemini,groq`, `AI_FALLBACK_ENABLED=true`, and optional model overrides. Preserve the existing Google and Upstash/KV credentials.

Run formatting, linting, unit tests, type checks, and build using the exact scripts in `package.json`; run `npx vitest run tests/unit/ai`. Test Gemini-only mode, secondary-provider eligibility, pre-token Gemini failure followed by Groq success, post-token interruption with no continuation, permanent errors with no fallback, total attempt bounds, and client abort propagation. Confirm only one terminal SSE event, one persisted assistant message, and citations from the final successful answer.

Use real Upstash with bounded `synapsedoc:ai-health:*` temporary keys: verify open/skip/cooldown/half-open/close, TTLs, concurrency-safe probe leasing, Redis failure fallback, and cleanup. Upload disposable normal-text and scanned PDFs and verify parsing, chunking, Gemini-profile embedding, storage, summary, chat streaming, citations, native extraction first, failed/empty OCR rejection, and page mapping. Confirm existing Gemini-indexed documents remain searchable, exact query-profile affinity, and that incompatible profiles fail safely. Verify rate limiting remains independent of provider fallback. Inspect safe logs for workload, provider/model, attempt, classification, circuit transition, streaming-start state, latency and final provider, with no prompts/documents/keys/tokens/raw responses.

Inspect the privacy and AI-disclosure pages at mobile and desktop widths. Perform bounded production verification only after local checks pass and only if explicitly authorized. Clean up Redis keys, test documents, users, provider artifacts, and verify storage/database cleanup.

Stop and report evidence if credentials are unavailable; a migration is unsafe or ambiguous; embeddings become incompatible; streaming duplicates content; provider switching bypasses rate limits; tests contradict the proposal; or storage/database/Redis/provider cleanup cannot be confirmed.

Report exactly:

Changed
Commands run
Verified
Runtime findings
Database/migration findings
Provider fallback findings
Embedding compatibility findings
OCR findings
Privacy/disclosure findings
Production findings
Cleanup
Risks
Rollback
Next step

Do not claim production readiness from compilation, tests, or build alone.
