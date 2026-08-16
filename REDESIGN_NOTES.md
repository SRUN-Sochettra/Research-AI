# Mogger Research — full visual redesign patch

## Design direction

Academic index terminal: deep ultramarine surfaces, safety-yellow signal color, dense sans display typography, squared research-file panels, and citation-led product language. The old purple/blue glass-gradient template language has been removed.

## Scope

- New public landing page and product narrative
- Rebuilt login and signup presentation
- Rebuilt authenticated header and responsive mobile navigation
- Rebuilt dashboard overview
- New global token system, typography, focus treatment, reduced-motion rules, and product-wide visual cleanup
- Restyled documents, upload, compare, settings, chat, citations, empty/loading states, and shared surfaces
- Renamed user-facing product source of truth to “Mogger Research”
- Preserved the existing RAG, API, database, upload, chat, and authentication logic

## Apply

Extract this ZIP at the repository root and allow it to overwrite matching paths.

## Verification performed

- Parsed 152 files from the supplied Repomix snapshot.
- Isolated TypeScript/TSX transpilation passed for every changed source file.
- Full npm install/build could not be run because the supplied snapshot contains no package-lock.json or node_modules and dependency installation timed out in the isolated environment.

## Required local gate

Run:

```bash
npm install
npm run test:all
npm run format:check
npm run build
```

Then visually test at 360px, 768px, 1280px, and 1536px, especially login, signup, dashboard, documents, upload dialog, document detail, and chat.
