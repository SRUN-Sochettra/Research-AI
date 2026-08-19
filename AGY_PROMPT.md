# Prompt for Agy — apply and verify the SynapseDoc legal patch

You are operating in the real SynapseDoc repository and deployment environment. Do not redesign the product or rewrite the legal text unless required to fix a verified mismatch. Treat this ZIP as a drop-in patch.

## Objective

Apply the included files, configure the missing legal contact, verify the code and live behavior, and report evidence without claiming more than was tested.

## Steps

1. Back up or commit current work. Extract this ZIP at the repository root and allow matching paths to overwrite.
2. Set `NEXT_PUBLIC_LEGAL_EMAIL` in `.env.local`, Vercel Production, and Preview if needed. Use a real monitored address belonging to the operator. Never place secrets in `NEXT_PUBLIC_*` values.
3. Inspect the diff. Confirm no unrelated files changed.
4. Run:
   ```bash
   npm ci
   npm run format
   npm run test:all
   npm run build
   ```
5. If TypeScript or JSX fails, make the smallest safe correction. Do not remove the legal routes, links, age statement, upload disclosures, or provider disclosures merely to pass tests.
6. Start the app and manually test at desktop and 360px mobile widths:
   - `/terms`
   - `/privacy`
   - `/acceptable-use`
   - `/ai-disclosure`
   - `/limits`
   - landing-page footer links
   - `/signup`: email signup and Google sign-in must not proceed until the checkbox is selected; keyboard focus and label interaction must work; error must be announced.
   - upload dialog: PDF-only and 10 MB limit text must be visible before file selection; the limits link must work.
7. Verify real API enforcement with authenticated requests:
   - reject empty files;
   - reject non-PDF files;
   - reject files over 10 MiB;
   - enforce 10-document quota;
   - enforce 5,000-character chat-message limit;
   - confirm actual production rate-limit behavior with Upstash configured.
8. Inspect and test the real Supabase project:
   - RLS enabled and ownership policies active for profiles, documents, chunks, conversations, and messages;
   - private `documents` bucket and per-user storage policies;
   - deleting a document removes storage object, chunks, intended conversations/messages, and stale IDs from multi-document conversation arrays;
   - determine backup retention and whether deleted data can remain in backups.
9. Verify production provider/data flow from runtime configuration and official current terms: Vercel, Supabase, Google Gemini API, Upstash, and any Langfuse behavior. The current repo has a no-op LangChain callback but also initializes the Langfuse SDK; determine whether any data is actually emitted. Update the privacy page only where evidence proves a correction is needed.
10. Implement a secure account-deletion endpoint and settings UI if the site is intended for public users. Requirements: recent authentication where supported, explicit confirmation naming the consequence, server-side user ownership checks, delete storage objects and application data before deleting the auth user, idempotent retries, safe partial-failure logging without PII, and a manual recovery path. Add tests. If not implemented, leave the policy's manual-request wording intact.
11. Add E2E coverage for legal routes, footer links, signup agreement gating, and upload-limit disclosure.
12. Deploy only after local checks pass. Then manually exercise the deployed production URL, including one real signup, one PDF upload, one AI question with citation, document deletion, and account-deletion/manual-request path. Capture provider/runtime logs. A green build is not proof of production behavior.

## Required report

Return:

- **Changed** — exact files and any additional corrections.
- **Verified** — each command and manual/live test with raw result.
- **Risks** — legal placeholders, provider-term uncertainty, retention/deletion gaps, live DB gaps.
- **Next step** — the smallest remaining action before public launch.

Do not claim legal compliance, complete deletion, privacy, security, or production readiness without direct evidence and qualified review.
