# Agy CLI — apply and verify the SynapseDoc visual cleanup

Work in the real repository. Read `AGENTS.md` first. This task is operational verification, not open-ended redesign.

## Objective

Apply `mogger-redesign-cleanup.patch` from the repository root. It removes the remaining purple/glass/gradient compatibility layer and normalizes the leftover dashboard, document, chat, shared-state, footer, and sidebar surfaces to the existing editorial research design system. Do not alter RAG, auth, database, API, upload, or chat behavior.

## Commands

```bash
git status --short
git apply --check mogger-redesign-cleanup.patch
git apply mogger-redesign-cleanup.patch
npx prettier --write src/app/globals.css   'src/app/(dashboard)/compare/compare-client.tsx'   'src/app/(dashboard)/compare/page.tsx'   'src/app/(dashboard)/documents/page.tsx'   'src/app/(dashboard)/settings/page.tsx'   src/components/chat/chat-interface.tsx   src/components/chat/document-selector.tsx   src/components/documents/diff-viewer.tsx   src/components/documents/document-card.tsx   src/components/documents/document-filters.tsx   src/components/documents/upload-button.tsx   src/components/layout/footer.tsx   src/components/layout/sidebar.tsx   src/components/shared/empty-states.tsx   src/components/shared/loading-states.tsx
npm run test:all
npm run format:check
npm run build
```

## Visual QA (required)

Run the app and inspect at 360px, 768px, 1280px, and 1536px:

- `/login`, `/signup`
- `/dashboard`
- `/documents` with zero docs, search with zero matches, and multiple docs
- `/compare`
- `/settings`
- `/chat/[documentId]` with empty, streaming, citations-expanded, rate-limited, and error states
- mobile sidebar

Verify: no purple/blue gradients, no glass blur, no unreadable dark-on-dark surfaces, no layout shifts in skeletons, keyboard-visible focus, touch targets, and no broken loading/error/empty states.

## Runtime work Copilot cannot perform here

1. Smoke-test production upload -> processing -> ready -> streamed cited answer.
2. Confirm Upstash is active at `/api/health` and force a real 429.
3. Verify Google OAuth end-to-end if enabled.
4. Check Vercel runtime logs for upload/chat failures.

Report exactly: **Changed / Verified / Visual QA / Runtime findings / Risks / Next step**. Paste real command output. Do not claim done unless `test:all`, `format:check`, and `build` are green and the visual matrix was manually exercised.
