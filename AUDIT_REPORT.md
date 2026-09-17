# SynapseDoc codebase audit and repair report

## Scope

Static audit of the complete text snapshot in `repomix-output.xml`, covering application routes, client state, document CRUD, chat streaming UI, accessibility, responsive controls, and global styling. Binary assets, environment variables, live Supabase/Upstash/Gemini behavior, browser rendering, and deployment logs were not available in this environment.

## Fixed findings

### Critical

1. **Stored/AI-output XSS in chat messages**
   - `MessageContent` inserted AI and document-derived text with `dangerouslySetInnerHTML` after only replacing Markdown bold markers.
   - Any HTML in model output could execute in the signed-in application origin.
   - Fixed by rendering a constrained Markdown subset as React text nodes. No generated string is injected as HTML.

2. **Document rename and deletion were wired to nonexistent API methods**
   - The UI sent `PATCH` and `DELETE` to `/api/documents/[id]`, but the route implemented only `GET`, causing HTTP 405 failures.
   - Added authenticated, ownership-scoped `PATCH` and `DELETE` handlers with title validation and explicit 401/404/400 behavior.

### High

3. **Document details scheduled a timer during render**
   - Every render while processing created another timeout, producing state updates after unmount, timer accumulation, and increasingly unstable UI behavior.
   - Replaced with one effect-managed interval and cleanup.

4. **Conversation switching and “New conversation” displayed stale chat state**
   - `useChat` initializes internal state once, so changing `initialMessages` did not replace the visible thread.
   - Added an explicit conversation-session remount boundary when selecting or starting a thread.

5. **Exports stayed stale after sending messages**
   - The parent page exported its original message state while the active chat maintained a separate internal state.
   - Added stable message and conversation-ID callbacks so export actions track the live stream and completed messages.

### Medium

6. **Duplicate loading indicators in chat**
   - A streaming assistant placeholder already displayed a typing indicator, while `ChatInterface` rendered a second “Thinking” row.
   - Removed the duplicate row.

7. **Indeterminate processing progress rendered as an empty 0% bar**
   - `value={null}` was converted to zero.
   - Added a bounded indeterminate indicator animation with reduced-motion handling inherited from the global rule.

8. **Search changed the route on every keystroke and polluted browser history**
   - Added a 300 ms debounce, normalized whitespace, preserved existing parameters, disabled scroll reset, and changed navigation to `replace`.

9. **Overflow menus were effectively hover-only**
   - Document and conversation menus were fully transparent outside hover, making them undiscoverable on touch devices.
   - Controls are now visible on touch/small screens and subdued, but still visible, on larger screens.

10. **Sidebar lacked current-page semantics**
    - Added `aria-current="page"` to active navigation links.

11. **Delete confirmation did not identify consequences clearly**
    - Document-card confirmation now names the document and states that associated conversations are removed.

## Important findings not claimed as runtime-verified

- The snapshot has extensive external-service behavior involving Supabase, Upstash, multiple AI providers, OCR, and Vercel. Static inspection cannot prove credentials, migrations, RLS policies, provider model availability, rate-limit behavior, streaming persistence, or cleanup behavior.
- Appearance was audited from JSX/CSS source only. No browser screenshots or computed-style inspection were possible here because the project dependencies and authenticated runtime were unavailable.
- The existing repository includes tests and verification scripts, but they were not executed in this environment. The ZIP therefore contains authored fixes plus an exact local verification prompt, not a claim of production readiness.

## Files changed

- `src/app/api/documents/[id]/route.ts`
- `src/app/globals.css`
- `src/components/chat/chat-interface.tsx`
- `src/components/chat/chat-page-client.tsx`
- `src/components/chat/conversation-sidebar.tsx`
- `src/components/chat/message-bubble.tsx`
- `src/components/documents/document-card.tsx`
- `src/components/documents/document-details.tsx`
- `src/components/documents/document-filters.tsx`
- `src/components/layout/sidebar.tsx`
- `src/components/ui/progress.tsx`

## Verification achieved

- Complete snapshot was reconstructed into 408 text files.
- Modified files were re-read after editing.
- A TypeScript syntax-oriented pass was attempted, but full type checking could not run because project dependencies could not be installed in the sandbox.
- No live service, browser, or production verification is claimed.
