# SynapseDoc

SynapseDoc is a source-grounded PDF research workspace. Upload a PDF document, let the ingestion pipeline parse, chunk, embed, and summarize it, and then query the document with streaming AI responses that cite specific page numbers and passage chunks.

---

## Product Overview

- **Document Ingestion:** Native text extraction (`pdf-parse`) with fallback to single-page multimodal OCR (`gemini-2.5-flash`) for scanned documents.
- **Chunking & Embeddings:** Recursive text chunking (1000 chars, 200 overlap) and 3,072-dimensional vector embeddings via `gemini-embedding-001`.
- **Vector Search & Reranking:** Cosine similarity retrieval via Supabase `pgvector` (`match_document_chunks` RPC), with optional Cohere cross-encoder reranking (`rerank-v3.5`, max 12 candidates).
- **Q&A & Streaming:** Multi-provider resilient chat routing with token streaming, citation binding, and single assistant row database persistence.
- **Isolation:** Row-Level Security (RLS) per user across profiles, documents, document chunks, conversations, and messages.

---

## AI Architecture & Multi-Provider Routing

SynapseDoc uses an adaptive multi-provider execution engine designed to degrade gracefully without breaking streaming contracts.

- **Adapters:** Dedicated Google Gemini adapter (`gemini-provider.ts`) and unified OpenAI-compatible adapter (`openai-compatible-provider.ts`) for direct and gateway providers.
- **Active Providers:** `gemini`, `groq`, `mistral`.
- **Reserve Provider:** Mistral serves as a reserve provider when Gemini or Groq is excluded due to configuration, open circuit, or capability mismatch.
- **Bounded Attempts:** At most two providers are selected per request (`AI_MAX_PROVIDERS_PER_REQUEST=2`), with up to two attempts per provider. A configured order of three providers does **not** mean all three are attempted for a single request.
- **Sequential Execution:** Provider calls are strictly sequential—no hedging, racing, or simultaneous dispatch.
- **Pre-Token Fallback:** Failover to the fallback provider occurs only before the first externally visible token is emitted. Once streaming begins, the router will never switch providers or append content from another provider.
- **Circuit Breaker:** Upstash Redis health store with 3-failure threshold, 45-second cooldown window, 300-second key TTL, and concurrency-safe `SET NX` half-open probe leasing.
- **Embedding & OCR Exclusivity:** Gemini remains the sole active embedding provider (`google:gemini-embedding-001:3072:v1`) and the sole active AI PDF OCR provider. Cohere is used exclusively for passage reranking.

---

## Active Models

| Workload              | Provider | Model Identifier                      | Details                               |
| :-------------------- | :------- | :------------------------------------ | :------------------------------------ |
| **Primary Chat**      | Gemini   | `gemini-3.1-flash-lite`               | Direct Google GenAI API               |
| **Fallback Chat**     | Groq     | `openai/gpt-oss-120b`                 | Direct OpenAI-compatible API          |
| **Reserve Chat**      | Mistral  | `mistral-small-latest`                | Direct OpenAI-compatible API          |
| **Embeddings**        | Gemini   | `gemini-embedding-001`                | 3,072 dimensions (`vector(3072)`)     |
| **Embedding Profile** | Gemini   | `google:gemini-embedding-001:3072:v1` | Strict profile verification           |
| **Passage Reranking** | Cohere   | `rerank-v3.5`                         | Optional, bounded to 12 candidates    |
| **PDF OCR Fallback**  | Gemini   | `gemini-2.5-flash`                    | Multimodal fallback for non-text PDFs |

_(Note: Model availability and latency depend on provider account quotas and terms)._

---

## Environment Variables

### Active Production Configuration

```dotenv
# Provider Routing Order & Fallback Bounds
AI_TEXT_PROVIDER_ORDER=gemini,groq,mistral
AI_FALLBACK_ENABLED=true
AI_MAX_PROVIDERS_PER_REQUEST=2

# Active Chat Models
GEMINI_CHAT_MODEL=gemini-3.1-flash-lite
GROQ_CHAT_MODEL=openai/gpt-oss-120b
MISTRAL_CHAT_MODEL=mistral-small-latest

# Passage Reranking (Cohere)
COHERE_RERANK_MODEL=rerank-v3.5
AI_RERANK_ENABLED=true
AI_RERANK_PROVIDER=cohere

# Required Server-Side API Credentials
GOOGLE_API_KEY=
GROQ_API_KEY=
MISTRAL_API_KEY=
COHERE_API_KEY=

# Inactive Providers (Omit from AI_TEXT_PROVIDER_ORDER)
CEREBRAS_API_KEY=
CEREBRAS_CHAT_MODEL=
SAMBANOVA_API_KEY=
SAMBANOVA_CHAT_MODEL=
OPENROUTER_API_KEY=
OPENROUTER_CHAT_MODEL=
HUGGINGFACE_TOKEN=
HUGGINGFACE_CHAT_MODEL=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_AI_API_TOKEN=
CLOUDFLARE_CHAT_MODEL=

# Preserved Infrastructure Credentials
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# App & Compliance Configuration
NEXT_PUBLIC_APP_URL=https://synapsedoc.vercel.app
NEXT_PUBLIC_LEGAL_EMAIL=
```

### Security & Deployment Rules

- All AI provider API keys and tokens must remain **server-only**. Never use `NEXT_PUBLIC_*` prefixes for AI credentials.
- `.env.local` is ignored and must never be committed to Git.
- Adding or changing environment variables in Vercel requires creating a new deployment for changes to take effect.
- Inactive providers (`cerebras`, `sambanova`, `openrouter`, `huggingface`, `cloudflare`) must not appear in `AI_TEXT_PROVIDER_ORDER`.

---

## Local Setup

```bash
# Clone and install dependencies
git clone https://github.com/SRUN-Sochettra/research-ai.git
cd research-ai
npm install

# Configure local environment
cp .env.example .env.local
# (Fill in your local credentials in .env.local)

# Start local dev server (Turbopack)
npm run dev
```

---

## Verification & Quality Gates

Run the standard repository gates before committing or deploying:

```bash
npm run format:check   # Prettier format check
npm run type-check     # TypeScript strict check (tsc --noEmit)
npm run lint           # ESLint analysis
npx vitest run tests/unit/ai # Focused AI router, provider, and reranker tests
npm run test           # Full Vitest unit test suite (19 suites, 158 tests)
npm run test:all       # Combined type-check, lint, and test suite
npm run build          # Next.js 16 production build
npx tsx scripts/pre-deploy-check.ts # Pre-deployment sanity check
```

---

## Deployment & Rollback

### Vercel Deployment

Deploying the `master` branch creates an optimized production build on Vercel:

```bash
vercel --prod
```

### Emergency Zero-Downtime Rollback

To immediately revert to single-provider Gemini-only execution without code changes, update Vercel environment variables:

```dotenv
AI_TEXT_PROVIDER_ORDER=gemini
AI_FALLBACK_ENABLED=false
AI_MAX_PROVIDERS_PER_REQUEST=1
AI_RERANK_ENABLED=false
```

Redeploy the project in Vercel to apply the configuration rollback.

---

## Known Limitations

1. **Scanned PDF OCR Fallback:** Scanned or image-only PDFs processed through Gemini Vision OCR fallback reconstruct extracted text under a single-page model without native citation-grade page boundary metadata.
2. **Inactive Providers:** Inactive providers (`cerebras`, `sambanova`, `openrouter`, `huggingface`, `cloudflare`) are not active in the production order.
3. **Data Retention & Privacy Terms:** SynapseDoc does not use customer documents to train proprietary models. Third-party AI model providers process data under their respective commercial terms, account agreements, and billing tiers.
4. **Bounded Verification:** Bounded smoke tests confirm functional routing and persistence invariants; they do not establish multi-tenant production load capacity.

---

## Architecture & Reference Documentation

- `AGENTS.md` — Source-of-truth operating guide and stack constraints
- `docs/ADAPTIVE_AI_ROUTING.md` — Multi-provider routing and fallback architecture
- `docs/ARCHITECTURE.md` — Ingestion and RAG pipeline architecture
- `docs/DEPLOYMENT.md` — Deployment procedures
- `docs/ERD.md` — Postgres and pgvector schema
- `SECURITY.md` — Security disclosures and vulnerability reporting
