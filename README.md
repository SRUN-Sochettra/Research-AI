<div align="center">
  <h1>🧠 Research AI</h1>
  <p>
    <strong>Autonomous AI agents that read PDFs, summarize content, and answer questions with citations.</strong>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/LangChain.js-agents-green" alt="LangChain" />
    <img src="https://img.shields.io/badge/Gemini-2.5_Flash-orange?logo=google" alt="Gemini" />
    <img src="https://img.shields.io/badge/Supabase-pgvector-emerald?logo=supabase" alt="Supabase" />
    <img src="https://img.shields.io/badge/deployed-Vercel-black?logo=vercel" alt="Vercel" />
  </p>

  <p>
    <a href="https://your-deployment-url.vercel.app">
      🔗 Live Demo
    </a>
    ·
    <a href="#architecture">
      📐 Architecture
    </a>
    ·
    <a href="#getting-started">
      🚀 Get Started
    </a>
  </p>
</div>

---

## 📸 What It Does

Upload any PDF → AI agents automatically process it → Ask questions → Get cited answers.

```
User uploads PDF
      │
      ▼
┌─────────────────────────────────────┐
│         AI AGENT PIPELINE           │
│                                     │
│  1. PDF Parser    → extracts text   │
│  2. Chunker       → splits smartly  │
│  3. Embedder      → vectorizes      │
│  4. Vector Store  → indexes in DB   │
│  5. Summarizer    → generates TL;DR │
└─────────────────────────────────────┘
      │
      ▼
User asks: "What are the key findings?"
      │
      ▼
┌─────────────────────────────────────┐
│           RAG PIPELINE              │
│                                     │
│  1. Reformulate query               │
│  2. Semantic search (pgvector)      │
│  3. Retrieve top-k chunks           │
│  4. Gemini generates answer         │
│  5. Stream to user + cite sources   │
└─────────────────────────────────────┘
```

---

## 🏗️ Architecture

### System Design

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT                             │
│   Next.js App Router + React Server Components         │
│   Streaming SSE responses + Optimistic UI updates      │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────────────┐
│                   API LAYER                             │
│   Next.js Route Handlers (serverless functions)        │
│   JWT Auth → Rate Limiting → Zod Validation            │
└──────┬──────────────────────────────┬──────────────────┘
       │                              │
┌──────▼──────┐              ┌────────▼────────┐
│  LangChain  │              │    Supabase      │
│   Agents    │              │                  │
│             │              │  ┌────────────┐ │
│ ┌─────────┐ │              │  │ PostgreSQL  │ │
│ │PDF Parse│ │              │  │ + pgvector  │ │
│ │Chunker  │ │◄────────────►│  └────────────┘ │
│ │Embedder │ │              │  ┌────────────┐ │
│ │Retriever│ │              │  │  Storage   │ │
│ │QA Agent │ │              │  │  (PDFs)    │ │
│ └─────────┘ │              │  └────────────┘ │
└──────┬──────┘              │  ┌────────────┐ │
       │                     │  │    Auth    │ │
┌──────▼──────┐              │  │  + RLS     │ │
│   Gemini    │              │  └────────────┘ │
│    API      │              └─────────────────┘
│  (LLM +     │
│  Embeddings)│
└─────────────┘
```

### Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Vector DB | Supabase pgvector | Avoids extra service, RLS applies to vectors too |
| LLM | Gemini 1.5 Flash | Generous free tier (1500 req/day), fast inference |
| Chunking strategy | Per-page + recursive | Preserves page citations for accuracy |
| Summarization | Map-reduce | Handles documents of any length |
| Streaming | SSE over WebSocket | Simpler, works with Next.js serverless |
| Auth | Supabase RLS | Row-level isolation — each user's data is isolated at DB level |

---

## ⚙️ Tech Stack

### Core
- **[Next.js 14](https://nextjs.org/)** — App Router, RSC, API Routes, Streaming
- **[TypeScript](https://www.typescriptlang.org/)** — Strict mode, full type safety
- **[LangChain.js](https://js.langchain.com/)** — Agent orchestration, chains, prompts
- **[Google Gemini](https://ai.google.dev/)** — LLM (gemini-1.5-flash) + Embeddings (text-embedding-004)

### Data
- **[Supabase](https://supabase.com/)** — PostgreSQL + pgvector + Auth + Storage
- **[Upstash Redis](https://upstash.com/)** — Serverless rate limiting

### UI
- **[Tailwind CSS](https://tailwindcss.com/)** — Utility-first styling
- **[shadcn/ui](https://ui.shadcn.com/)** — Accessible component primitives

### Observability
- **[Langfuse](https://langfuse.com/)** — LLM call tracing, latency, cost tracking
- Structured JSON logging for production log aggregation

### DevOps
- **[Vercel](https://vercel.com/)** — Deployment, Edge Network, Analytics
- **[GitHub Actions](https://github.com/features/actions)** — CI/CD (type check → test → build → deploy)
- **[Vitest](https://vitest.dev/)** — Unit tests
- **[Playwright](https://playwright.dev/)** — E2E tests

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com/) project (free)
- A [Google AI Studio](https://aistudio.google.com/) API key (free)
- An [Upstash](https://upstash.com/) Redis database (free, optional)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/research-ai.git
cd research-ai
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```bash
# Supabase (from your project settings)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Google Gemini (from AI Studio)
GOOGLE_API_KEY=AIza...

# Upstash Redis (optional - rate limiting)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

In your Supabase project, go to **SQL Editor** and run:

```sql
-- 1. Enable pgvector
create extension if not exists vector;

-- 2. Run the full schema
-- (Copy from src/lib/db/schema.sql)
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

### 5. Run Tests

```bash
npm run test           # Unit tests
npm run test:e2e       # E2E tests
npm run type-check     # TypeScript
```

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Login, Signup pages
│   ├── (dashboard)/        # Protected pages
│   │   ├── documents/      # Document management
│   │   └── chat/           # Chat interface
│   └── api/                # API routes
│       ├── upload/         # PDF upload + pipeline trigger
│       ├── chat/           # RAG Q&A (streaming SSE)
│       ├── documents/      # Document CRUD
│       └── health/         # Health check
├── lib/
│   ├── agents/             # LangChain AI agents
│   │   ├── pdf-parser.ts   # PDF text extraction
│   │   ├── chunker.ts      # Smart text splitting
│   │   ├── embedder.ts     # Gemini embeddings
│   │   ├── retriever.ts    # pgvector similarity search
│   │   ├── qa-agent.ts     # RAG Q&A chain
│   │   ├── summarizer.ts   # Map-reduce summarization
│   │   └── orchestrator.ts # Pipeline coordinator
│   ├── ai/                 # AI configuration
│   │   ├── gemini.ts       # Model clients
│   │   └── prompts.ts      # Centralized prompts
│   ├── db/                 # Database layer
│   │   ├── supabase/       # Supabase clients
│   │   └── queries/        # Type-safe queries
│   └── services/           # Business logic
├── components/             # React components
│   ├── chat/               # Chat interface components
│   ├── documents/          # Document management components
│   └── shared/             # Reusable components
├── hooks/                  # Custom React hooks
└── types/                  # TypeScript type definitions
```

---

## 🔐 Security

- **Row Level Security** — PostgreSQL RLS ensures users only access their own data — enforced at the database level
- **JWT Validation** — Every API route validates Supabase JWT before processing
- **Input Validation** — Zod schemas validate all inputs on both client and server
- **Rate Limiting** — Sliding window rate limiting via Upstash Redis
- **File Validation** — MIME type + size validation before any processing
- **Security Headers** — CSP, X-Frame-Options, HSTS, and more via Next.js
- **No Secret Exposure** — Service role key never sent to client

---

## 📊 Performance

- **Streaming** — Responses stream token-by-token, no waiting for full completion
- **Batch Embeddings** — Chunks embedded in parallel batches of 10
- **Smart Caching** — Status API cached per document readiness state
- **RSC** — Document lists rendered on server, reducing client bundle
- **Optimistic UI** — Messages appear instantly, synced with DB after

---

## 💰 Cost (Portfolio = $0/month)

| Service | Free Tier | This Project Uses |
|---------|-----------|-------------------|
| Vercel | 100GB bandwidth | ~1GB/mo |
| Supabase | 500MB DB, 1GB storage | ~50MB |
| Gemini API | 1,500 req/day | ~200/day |
| Upstash | 10k cmds/day | ~500/day |
| **Total** | **—** | **$0.00** |

---

## 🗺️ What I'd Add With More Time

- [ ] **Background job queue** (Trigger.dev/Inngest) for truly async processing
- [ ] **Multi-document chat** — Ask questions across multiple PDFs
- [ ] **Langfuse integration** — Full LLM observability dashboard
- [ ] **Export conversations** — Download Q&A as PDF/markdown
- [ ] **OCR support** — Process scanned PDFs via Google Vision API
- [ ] **Collaborative workspaces** — Share documents with team

---

## 👤 Author

**Your Name**
- GitHub: [@SRUN-Sochettra](https://github.com/SRUN-Sochettra)
- LinkedIn: [linkedin.com/in/srunsochettra](https://linkedin.com/in/srunsochettra)
- Portfolio: [srunsochettra.vecel.app](https://srunsochettra.vercel.app)

---

<div align="center">
  <p>Built to demonstrate AI engineering, RAG pipelines, and full-stack architecture.</p>
  <p>⭐ Star this repo if it helped you learn something!</p>
</div>
