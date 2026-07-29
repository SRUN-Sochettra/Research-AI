# 🧠 Research AI

**Autonomous AI agents that read PDFs, summarize content, and answer questions with citations.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![LangChain.js](https://img.shields.io/badge/LangChain.js-agents-green)](https://js.langchain.com/)
[![Gemini](https://img.shields.io/badge/Gemini-3.1_Flash_Lite-orange?logo=google)](https://ai.google.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-pgvector-emerald?logo=supabase)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/deployed-Vercel-black?logo=vercel)](https://vercel.com/)

[🔗 Live Demo](https://your-deployment-url.vercel.app) · [📐 Architecture](#-architecture) · [🚀 Get Started](#-getting-started)

---

## 📸 What It Does

Upload any PDF → AI agents automatically process it → Ask questions → Get cited answers with page-level references.

```text
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

```text
┌─────────────────────────────────────────────────────────┐
│                      CLIENT                             │
│   Next.js App Router + React Server Components          │
│   Streaming SSE responses + Optimistic UI updates       │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────────────┐
│                   API LAYER                             │
│   Next.js Route Handlers (serverless functions)         │
│   JWT Auth → Rate Limiting → Zod Validation             │
└──────┬──────────────────────────────┬───────────────────┘
       │                              │
┌──────▼──────┐              ┌────────▼────────┐
│  LangChain  │              │    Supabase     │
│   Agents    │              │                 │
│             │              │  ┌────────────┐ │
│ ┌─────────┐ │              │  │ PostgreSQL │ │
│ │PDF Parse│ │              │  │ + pgvector │ │
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

| Decision            | Choice                                      | Rationale                                                        |
| ------------------- | ------------------------------------------- | ---------------------------------------------------------------- |
| Vector DB           | Supabase pgvector                           | Avoids extra service, RLS applies to vectors too                 |
| LLM                 | Gemini 3.1 Flash Lite (with fallback chain) | 500 RPD free tier + auto-fallback to 2.5 Flash if rate limited   |
| Embeddings          | gemini-embedding-001 (3072 dims)            | Latest stable embedding model with high accuracy                 |
| Chunking strategy   | Per-page + recursive                        | Preserves page citations for accuracy                            |
| Summarization       | Map-reduce with sampling                    | Handles documents of any length within rate limits               |
| Streaming           | SSE over WebSocket                          | Simpler, works with Next.js serverless                           |
| Auth                | Supabase RLS                                | Row-level isolation — each user's data is isolated at DB level   |
| Rate limit recovery | Multi-model fallback chain                  | Pipeline never crashes — degrades gracefully through model tiers |

---

## ⚙️ Tech Stack

### Core

- **[Next.js 16](https://nextjs.org/)** — App Router, RSC, Turbopack, Streaming SSE
- **[TypeScript](https://www.typescriptlang.org/)** — Strict mode, full type safety
- **[LangChain.js](https://js.langchain.com/)** — Agent orchestration, chains, prompts
- **[Google Gemini](https://ai.google.dev/)** — LLM (gemini-3.1-flash-lite) + Embeddings (gemini-embedding-001, 3072d)

### Data

- **[Supabase](https://supabase.com/)** — PostgreSQL + pgvector + Auth + Storage
- **[Upstash Redis](https://upstash.com/)** — Serverless rate limiting

### UI

- **[Tailwind CSS v4](https://tailwindcss.com/)** — Utility-first styling, CSS variables theming
- **[shadcn/ui](https://ui.shadcn.com/)** — Accessible component primitives
- **Custom design system** — Glassmorphism, gradient accents, dark-first

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

> **Note:** View the [Entity-Relationship Diagram (ERD)](docs/ERD.md) for a complete map of the database schema.

In your Supabase project, go to **SQL Editor** and run the following:

#### Enable pgvector and create tables

```sql
-- Enable pgvector extension
create extension if not exists vector;

-- Create profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create documents table
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  file_name text not null,
  file_path text not null,
  file_size bigint not null,
  mime_type text not null,
  page_count integer,
  status text not null default 'uploaded'
    check (status in ('uploaded', 'processing', 'ready', 'error')),
  summary text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create document_chunks table with 3072-dim vectors
create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  content text not null,
  chunk_index integer not null,
  page_number integer,
  token_count integer not null,
  embedding vector(3072),
  metadata jsonb,
  created_at timestamptz default now()
);

-- Create conversations table
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  title text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create messages table
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  citations jsonb,
  token_usage jsonb,
  latency_ms integer,
  created_at timestamptz default now()
);
```

#### Create vector similarity search function

```sql
create or replace function match_document_chunks(
  query_embedding vector(3072),
  match_document_id uuid,
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  page_number int,
  similarity float
)
language sql stable
as $$
  select
    document_chunks.id,
    document_chunks.content,
    document_chunks.page_number,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  where
    document_chunks.document_id = match_document_id
    and 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
$$;
```

#### Auto-create profile on signup

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
```

#### Create storage bucket and policies

In **Supabase Dashboard → Storage**, create a bucket named `documents` (private). Then run:

```sql
create policy "Users can upload their own documents"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can read their own documents"
on storage.objects for select to authenticated
using (
  bucket_id = 'documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their own documents"
on storage.objects for delete to authenticated
using (
  bucket_id = 'documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);
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

```text
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
│   │   ├── pdf-parser.ts   # PDF text extraction (pdf-parse v2)
│   │   ├── chunker.ts      # Smart text splitting
│   │   ├── embedder.ts     # Gemini embeddings (3072d)
│   │   ├── retriever.ts    # pgvector similarity search
│   │   ├── qa-agent.ts     # RAG Q&A chain
│   │   ├── summarizer.ts   # Map-reduce with model fallback
│   │   └── orchestrator.ts # Pipeline coordinator
│   ├── ai/                 # AI configuration
│   │   ├── gemini.ts       # Model clients + fallback chain
│   │   └── prompts.ts      # Centralized prompts
│   ├── db/                 # Database layer
│   │   ├── supabase/       # Supabase clients (browser/server/admin)
│   │   └── queries/        # Type-safe queries
│   └── services/           # Business logic
├── components/             # React components
│   ├── chat/               # Chat interface components
│   ├── documents/          # Document management components
│   ├── layout/             # Header, navigation
│   └── shared/             # Reusable components
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type definitions
└── proxy.ts                # Next.js proxy (formerly middleware)
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
- **Storage Isolation** — Storage policies enforce per-user folder access

---

## 📊 Performance

- **Streaming** — Responses stream token-by-token, no waiting for full completion
- **Batch Embeddings** — Chunks embedded in parallel batches of 10
- **Smart Caching** — Status API cached per document readiness state
- **RSC** — Document lists rendered on server, reducing client bundle
- **Optimistic UI** — Messages appear instantly, synced with DB after
- **Model Fallback Chain** — Auto-switches between Gemini 3.1 Flash Lite → 2.5 Flash → 2.5 Flash Lite when rate limited
- **Graceful Degradation** — Pipeline never crashes; falls back to first chunk content if all summaries fail

---

## 💰 Cost (Portfolio = $0/month)

| Service                     | Free Tier             | This Project Uses |
| --------------------------- | --------------------- | ----------------- |
| Vercel                      | 100GB bandwidth       | ~1GB/mo           |
| Supabase                    | 500MB DB, 1GB storage | ~50MB             |
| Gemini API (3.1 Flash Lite) | 500 RPD               | ~50/day           |
| Upstash                     | 10k cmds/day          | ~500/day          |
| **Total**                   | **—**                 | **$0.00**         |

---

## 🗺️ What I'd Add With More Time

- [x] **Background job queue** (Trigger.dev/Inngest) for truly async processing
- [x] **Multi-document chat** — Ask questions across multiple PDFs
- [x] **Langfuse integration** — Full LLM observability dashboard
- [x] **Export conversations** — Download Q&A as PDF/markdown
- [x] **OCR support** — Process scanned PDFs via Google Vision API
- [ ] **Collaborative workspaces** — Share documents with team
- [x] **Document comparison** — Side-by-side diff of two PDFs

---

## 👤 Author

**SRUN-Sochettra**

- GitHub: [@SRUN-Sochettra](https://github.com/SRUN-Sochettra)
- LinkedIn: [linkedin.com/in/sochettra-srun-a67466395](https://www.linkedin.com/in/sochettra-srun-a67466395/)
- Portfolio: [srunsochettra.vercel.app](https://srunsochettra.vercel.app)

---

Built to demonstrate AI engineering, RAG pipelines, and full-stack architecture.

⭐ Star this repo if it helped you learn something!

#### Multi-Document Chat Support

To enable querying multiple documents at once, run the following SQL:

```sql
-- Add document_ids to conversations table
alter table public.conversations alter column document_id drop not null;
alter table public.conversations add column if not exists document_ids uuid[];

-- Create vector similarity search function for multiple documents
create or replace function match_multiple_document_chunks(
  query_embedding vector(3072),
  match_document_ids uuid[],
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  page_number int,
  similarity float
)
language sql stable
as $$
  select
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.content,
    document_chunks.page_number,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  where
    document_chunks.document_id = any(match_document_ids)
    and 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
$$;
```
