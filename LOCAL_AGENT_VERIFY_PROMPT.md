You are the operational verifier for the SynapseDoc repair overlay. Do not redesign the application or delegate architecture. Work only from the real local repository after the user extracts the supplied ZIP over it.

1. Read `AGENTS.md` and inspect `git status --short`. Preserve `.env.local` and all unrelated work. Stop if the overlay would overwrite unrelated uncommitted edits.
2. Inspect `AUDIT_REPORT.md` and the exact changed files listed there. Do not revert the security or behavior fixes unless a real compiler/test/runtime failure proves a narrower correction is required.
3. Run:

```bash
npm install
npm run format
npm run type-check
npm run lint
npm run test
npm run build
```

4. If a gate fails, capture the exact output, make only the smallest compatibility fix required by the installed dependencies, and rerun the failed gate plus downstream gates. Do not invent APIs or disable checks.
5. Add focused regression tests for:
   - `/api/documents/[id]` PATCH: unauthenticated 401, invalid title 400, foreign/missing document 404, valid owned rename 200.
   - `/api/documents/[id]` DELETE: unauthenticated 401, foreign/missing document 404, valid owned deletion 200.
   - chat message rendering keeps literal `<img onerror=...>` and `<script>` text inert while still rendering `**bold**` as `<strong>`.
   - switching conversations replaces visible messages, starting a new conversation clears them, and live streamed messages update parent export state.
6. Start the app and manually inspect 360, 768, 1280, and 1536 px widths in light and dark mode. Exercise `/documents`, `/documents/[id]`, `/chat/[documentId]`, the mobile conversation sheet, document search, processing progress, rename, delete, live streaming, citations, and both exports. Verify no horizontal overflow, no hover-only controls, one typing indicator, visible focus, safe long titles, and stable processing UI.
7. With disposable data and existing credentials, verify upload -> processing -> ready, rename persistence, download, chat streaming with citations, conversation switching, document deletion including storage/conversation cleanup, and a real 429 recovery. Inspect safe runtime logs without printing secrets. Clean up all disposable data.
8. Report exactly:

Changed
Commands run
Type/lint/test/build evidence
Regression tests added
Visual QA
Runtime findings
Cleanup
Not verified
Risks
Next step

Do not claim production readiness from compilation or tests alone. Return raw failure evidence if credentials, browser dependencies, migrations, or external services block a step.
