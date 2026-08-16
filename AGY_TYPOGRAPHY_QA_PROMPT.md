# Agy CLI — verify the SynapseDoc typography and auth-layout pass

Work in the real repository. Read `AGENTS.md` first. Extract the supplied ZIP at the repository root and overwrite matching files. Do not redesign or change application behavior.

## What Copilot changed

- Replaced the app-wide Inter/default typography with Manrope.
- Replaced default monospace UI text with IBM Plex Mono.
- Normalized display headings so buttons and body text never inherit a serif/browser-default face.
- Rebalanced `/login` and `/signup` so the left panel content is vertically intentional instead of leaving a dead blank region.
- Added a visible Google mark to both OAuth buttons.
- Kept auth, RAG, API, database, and routing behavior unchanged.

## Required checks

Run and paste the real output:

```bash
npm install
npm run format
npm run test:all
npm run format:check
npm run build
```

If a font import is rejected by the installed Next.js version, inspect `node_modules/next/font/google/index.d.ts`, use the exact supported export, and make the smallest equivalent fix. Do not fall back to browser-default fonts.

## Visual QA

Run the app and inspect `/`, `/login`, `/signup`, `/dashboard`, `/documents`, and one chat screen at 360px, 768px, 1280px, and 1536px.

Verify:

- Manrope is the computed font for body text, controls, navigation, and display headings.
- IBM Plex Mono is the computed font for eyebrow/metadata text.
- No Times New Roman, Georgia, or browser-default serif appears.
- The Google mark appears and remains aligned at all widths.
- Login/signup have no unexplained empty block, overflow, clipped heading, or mobile horizontal scroll.
- Focus rings, keyboard navigation, input labels, loading states, and reduced motion still work.

Report exactly: **Changed / Verified / Visual QA / Risks / Next step**. Do not claim completion without green test, format, build output and manual viewport inspection.
