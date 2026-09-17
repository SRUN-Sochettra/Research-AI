# Apply and verify

## Files included

- `src/hooks/use-chat.ts`
- `tests/unit/hooks/use-chat.test.tsx`
- `APPLY_AND_VERIFY.md`

## Exact change

`useChat` now omits `conversationId` from the JSON request body while its state is `null`. When an existing conversation ID is present, it is serialized unchanged. The server schema remains strict and unchanged: omission creates a conversation, while a supplied value must be a UUID.

Focused hook tests now prove:

1. A first-message request has no own `conversationId` property.
2. An existing UUID is retained unchanged.
3. The existing `meta` → `token` → `citations` → `done` regression still verifies state updates.

No chat route, schema, SSE, citation, persistence, cancellation, export, dependency, lockfile, database, provider, environment, or production configuration file is changed.

## Verification achieved here

- Parsed the complete Repomix snapshot and reconstructed all 423 packed text files.
- Inspected the requested hook, API schema, chat route, hook tests, stream lifecycle tests, conversation queries/routes, chat UI/export state flow, `package.json`, `vitest.config.ts`, and `tsconfig.json`.
- Confirmed the defect from repository evidence: `useChat` initialized the state to `null` and serialized that value; `chatSchema` accepts an omitted UUID but rejects `null`; the route returns HTTP 400 before conversation creation and streaming when parsing fails.
- Re-read the changed files and ran static overlay assertions confirming the conditional omission and all three required regression cases are present.
- Project dependencies were not available. An isolated `npm install --ignore-scripts --no-package-lock` attempt timed out and produced no usable dependency tree, so no TypeScript, Prettier, Vitest, ESLint, or Next.js build result is claimed.

## Remaining local verification

Run the exact repository scripts below, then exercise one disposable authenticated first-message chat flow. Runtime confirmation must include HTTP 200, ordered `meta`, `token`, `citations`, and `done` events, one conversation, one user message, one assistant message, valid citations, and complete cleanup.

## Rollback

If the overlay is not committed:

```bash
git restore -- src/hooks/use-chat.ts tests/unit/hooks/use-chat.test.tsx
rm APPLY_AND_VERIFY.md
```

If committed, revert that commit instead. There is no dependency, lockfile, configuration, environment, or database rollback.

## Local-agent prompt

```text
You are the operational verifier for a narrowly scoped SynapseDoc chat request serialization fix. Work in the real local repository. Read AGENTS.md and follow repository instructions, using Graft first where available. Do not redesign or broaden the change. Preserve .env.local, secrets, provider configuration, database state, and every unrelated edit.

1. Run `git status --short` before changing anything. Inspect the supplied overlay files `src/hooks/use-chat.ts`, `tests/unit/hooks/use-chat.test.tsx`, and `APPLY_AND_VERIFY.md`. Compare them with the current worktree and stop with the exact conflicting paths if applying or retaining the overlay would overwrite unrelated uncommitted edits. Otherwise apply or retain only these supplied changes.
2. Verify the intended delta is only this: when `useChat` state has no conversation ID, the POST `/api/chat` JSON body has no own `conversationId` property; when a valid existing UUID is present, it is serialized unchanged. Keep the server schema strict. Do not alter other chat state, SSE parsing, citations, persistence, cancellation, errors, routes, exports, UI, dependencies, lockfiles, environment files, provider configuration, database schema, or production configuration.
3. Run, in order, preserving raw command output and exit codes: `npm run format:check`, `npm run type-check`, `npm run lint`, `npx vitest run tests/unit/hooks/use-chat.test.tsx`, `npm run test`, and `npm run build`. Do not weaken or remove tests. If a command is missing, report that exact fact rather than substituting an invented success. If formatting is the only failure, format only the two changed TypeScript files using the repository formatter, then rerun all gates.
4. Start the local app with the repository's normal development command and run one bounded authenticated disposable-PDF first-message flow with no initial conversation. Capture the outgoing request body and prove it has no own `conversationId` property. Verify POST `/api/chat` returns HTTP 200 and SSE ordering is `meta`, one or more `token` events, `citations`, then `done`, with no `error` event. Confirm the meta conversation UUID becomes client state, citations remain attached, exactly one conversation, one user message, and one assistant message are persisted, and no duplicate assistant content is produced.
5. Delete the disposable document, conversation/messages, storage object, test account if one was created, and any test-only external artifacts. Verify cleanup directly. Do not touch production unless separately authorized.
6. Report exactly: Changed; Git status and conflict check; Commands run with raw exit evidence; Focused regression result; Full gate results; Runtime first-message evidence; SSE and citation evidence; Persistence evidence; Cleanup; Not verified; Risks; Rollback. Do not claim production readiness.
```
