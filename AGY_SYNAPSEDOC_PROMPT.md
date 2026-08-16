# Agy CLI task — apply and verify the SynapseDoc redesign

Work in the real local repository. Read `AGENTS.md` first. Copilot has already authored the redesign in the attached ZIP; your job is to apply it, run the real toolchain, inspect it in a browser, and report runtime evidence. Do not redesign it again unless a verified failure requires a focused fix.

## Objective

Rename the product to **SynapseDoc** and apply the connected-evidence visual system: warm paper surfaces, deep green-black structure, one teal signal color, custom node-and-link brand mark, restrained typography, no purple/blue AI gradients, no glass panels, no fake status indicators, and no emoji in the product UI.

Do not change RAG behavior, authentication behavior, database/schema behavior, API contracts, uploads, retrieval, streaming, citations, or rate limits merely for the redesign.

## Apply

1. Back up or commit the current repository state.
2. Extract `synapsedoc-redesign.zip` at the repository root and overwrite matching files.
3. Run `git diff --stat` and `git diff -- src package.json README.md`.
4. Inspect unexpected changes before continuing. Preserve local secret files and never commit `.env.local`.

## Required checks

Run these commands exactly and paste the real output:

```bash
npm install
npm run format
npm run test:all
npm run format:check
npm run build
grep -RInE "Mogger|Research AI|research-ai|mogger-research" src package.json README.md docs SECURITY.md CONTRIBUTING.md || true
grep -RInP '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' src || true
```

Both grep commands must return no user-facing branding or emoji matches. If old deployment URLs occur only in historical docs, update them to the actual deployed hostname rather than inventing a new one.

## Visual QA

Run the app and inspect at 360px, 768px, 1280px, and 1536px:

- `/`
- `/login`
- `/signup`
- `/dashboard`
- `/documents`: zero documents, search with zero matches, one document, many documents
- upload dialog: invalid file, selected, uploading, processing, success, failure
- `/documents/[id]`
- `/compare`
- `/settings`
- `/chat/[documentId]`: empty, streamed response, citations expanded, rate limited, error
- `/chat/multi`
- 404 and global error surfaces
- mobile navigation and conversation sidebar

Verify:

- Every visible product name says SynapseDoc.
- The custom SynapseDoc mark renders cleanly and is not replaced with a brain emoji/icon.
- There are no purple-to-blue gradients, glass blur panels, random glows, fake operational indicators, or emoji.
- Light and dark themes remain readable; foreground/background and focus states have adequate contrast.
- Keyboard focus is visible; dialogs and sheets trap/restore focus correctly; navigation exposes `aria-current`.
- Touch targets are usable on mobile and controls do not depend on hover.
- Loading skeletons resemble the final layouts and do not introduce obvious layout shift.
- Long document titles, long email addresses, empty states, failures, and narrow screens do not overflow.
- Reduced-motion mode removes nonessential motion.

## Runtime work Copilot cannot verify from the static snapshot

1. Smoke-test signup, login, sign-out, and Google OAuth if enabled.
2. Exercise upload -> processing -> ready with a real PDF.
3. Ask a real question and confirm a streamed answer with working page citations.
4. Confirm `/api/health` accurately reports Supabase, Gemini, and Upstash.
5. Trigger a real 429 and verify the recovery copy and reset behavior.
6. Inspect deployment logs for upload/chat failures.
7. Confirm the exact production hostname and update environment variables, auth redirects, CORS, metadata, and deployment docs if it changed.

## Rules

- Make only the smallest fix needed for a verified issue.
- Do not replace the design with another generic dashboard template.
- Do not add gradients, glassmorphism, decorative neural-network stock art, fake metrics, fake testimonials, or emoji.
- Do not claim success based only on compilation. Report the exact verification level reached.
- If a command fails, stop, diagnose from real output, fix only the demonstrated cause, and rerun the failed gate plus affected downstream gates.

## Report format

Report exactly:

**Changed / Verified / Visual QA / Runtime findings / Risks / Next step**

Include real command output. Do not claim complete unless `test:all`, `format:check`, and `build` are green and the visual/runtime matrix was manually exercised.
