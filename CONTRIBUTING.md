# Contributing to SynapseDoc

Thanks for contributing to SynapseDoc!

> **AI agents:** read [`AGENTS.md`](AGENTS.md) first — it's the primary context
> file (project overview, conventions, config source of truth, and known traps).

## How Can I Contribute?

### Reporting Bugs

Open an issue with steps to reproduce, expected vs actual behavior, and any
relevant logs or environment details.

### Suggesting Enhancements

Open an issue with a clear, detailed description of the feature and its
motivation.

### Pull Requests

1. Fork the repo and branch off **`main`** (or `develop`).
2. Add or update tests for any code you change (Vitest for units, Playwright
   for E2E).
3. If you change an API, update the docs (`docs/API.md`, and `docs/ARCHITECTURE.md`
   / `docs/ERD.md` if the pipeline or schema changes).
4. Make sure the full check suite passes locally (see below).
5. Open the pull request against `main`.

## Local Development

Follow the setup steps in [`README.md`](README.md) and
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). In short:

```bash
cp .env.example .env.local   # fill in Supabase + Gemini keys
npm install
npm run dev
```

## Code Style & Checks

Match the existing codebase style. Before submitting, run the same gates CI
enforces (TypeScript → ESLint → Prettier → tests):

```bash
npm run test:all       # type-check + lint + unit tests
npm run format:check   # Prettier (use `npm run format` to auto-fix)
npm run test:e2e       # Playwright (optional locally; CI runs it)
```

CI runs on pushes to `main`/`develop` and PRs to `main`, in this order:
type-check → lint → Prettier check → Vitest → build → Playwright. If it won't
pass CI, it isn't ready.

## Conventions (quick reference)

- Prettier: 2-space, double quotes, semicolons, `printWidth` 80.
- Config values (models, dims, limits) come from `src/lib/utils/constants.ts` —
  don't hardcode them elsewhere.
- All DB access goes through `src/lib/db/queries/*`; prefer the RLS-scoped
  server client over the service-role admin client.
- Validate API inputs with the Zod schemas in `src/types/api.ts` and return the
  `ApiResponse<T>` envelope.

Thank you for contributing!
