# SynapseDoc

SynapseDoc is a private, source-grounded PDF research workspace. Upload a document, let the ingestion pipeline parse and index it, then ask questions and trace answers back to page-level citations.

## Product identity

The interface uses a connected-evidence visual system: warm paper surfaces, deep green-black structure, a single teal signal color, and a custom node-and-link mark. It intentionally avoids purple-blue gradients, glass panels, fake operational indicators, decorative AI imagery, and emoji.

## Stack

- Next.js 16 and React 19
- TypeScript strict mode
- Supabase Auth, Postgres, pgvector, and Storage
- Google Gemini through LangChain.js
- Upstash Redis rate limiting
- Tailwind CSS v4 and Radix/shadcn primitives
- Vitest and Playwright

## Local setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Required environment variables are documented in `.env.example`. Never commit `.env.local` or service-role credentials.

## Verification gate

```bash
npm run test:all
npm run format:check
npm run build
```

For the complete visual and production verification matrix, follow `AGY_SYNAPSEDOC_PROMPT.md`.

## Architecture and operations

- `AGENTS.md` — source-of-truth operating guide
- `docs/ARCHITECTURE.md` — ingestion and RAG architecture
- `docs/API.md` — endpoint contracts
- `docs/DEPLOYMENT.md` — deployment steps
- `docs/ERD.md` — data model
- `SECURITY.md` — vulnerability reporting
