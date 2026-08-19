# Architecture Deep Dive

> Source of truth: this doc is kept in sync with the code. Config values come from
> `src/lib/utils/constants.ts`; the schema comes from `src/types/database.ts` and
> `supabase/migrations/`. If code and this doc ever disagree, the code wins — fix the doc.

## RAG Pipeline

The Retrieval-Augmented Generation pipeline has 5 distinct stages:

### Stage 1: PDF Parsing

```
Input:  Raw PDF buffer
Output: Extracted text + page-level text array

Tool:   pdf-parse library (serverExternalPackages — Node runtime only)
Key:    Page-level tracking for citation accuracy
Edge:   Handles both searchable and hybrid PDFs
```

### Stage 2: Text Chunking

```
Input:  Raw document text + page array
Output: Array of TextChunk objects

Strategy: RecursiveCharacterTextSplitter
  chunkSize:    1000 tokens
  chunkOverlap: 200 tokens (prevents context loss at boundaries)

Per-page chunking preferred:
  - Better citation accuracy
  - Natural document structure preserved

Fallback: Full-text chunking if pages unavailable
```

### Stage 3: Embedding Generation

```
Input:  TextChunk array
Output: EmbeddedChunk array (with vector(3072))

Model:  gemini-embedding-001 (Gemini)
Dims:   3072
Batch:  10 chunks per API call (embedder.ts BATCH_SIZE)
Retry:  Exponential backoff (3 attempts), ~200ms delay between batches
```

### Stage 4: Vector Storage

```
Input:  EmbeddedChunk array
Output: Rows in document_chunks table

Extension:   pgvector
Column:      embedding vector(3072)
Distance:    cosine  (<=> operator in the match_* SQL functions)
Bulk insert: 50 rows per batch (documents.ts saveChunks — avoids payload limits)

⚠️ No ANN index is currently defined on the embedding column. Retrieval is an
   exact (sequential) cosine scan via the match_document_chunks /
   match_multiple_document_chunks SQL functions. Note: pgvector ivfflat/hnsw
   indexes cap at 2000 dimensions, so a 3072-dim vector cannot use them directly
   (would require halfvec or dimensionality reduction). Fine at portfolio scale;
   revisit if the chunk table grows large.
```

### Stage 5: Summarization

```
Input:  TextChunk array
Output: Summary string (150-300 words)

Strategy: Conditional
  Short docs (< 3000 tokens): Direct summarization
  Long docs: Map-reduce
    MAP:    Summarize each sampled chunk independently
    REDUCE: Combine summaries into final summary

Resilience: degrades through the model fallback chain on rate limits and
            falls back to first-chunk content if all summaries fail
            (never crashes the pipeline).
```

## Q&A Pipeline

```
User Question
    │
    ▼
Query Reformulation (if history exists)
    │ Standalone question for retrieval
    ▼
Query Embedding (Gemini gemini-embedding-001)
    │ vector(3072)
    ▼
pgvector Similarity Search
    │ SELECT ... ORDER BY embedding <=> query_embedding
    │ WHERE similarity > 0.7 LIMIT 5
    ▼
Context Formatting
    │ [Source 1 (Page 3)]: ...text...
    │ [Source 2 (Page 7)]: ...text...
    ▼
Gemini Generation (streaming, model fallback chain)
    │ Prompt = system + context + history + question
    ▼
SSE Stream to Client
    │ token by token
    ▼
Citation Extraction + DB Persistence
```

Retrieval defaults (`similarityThreshold: 0.7`, `maxRetrievedChunks: 5`,
`maxConversationHistory: 10`) come from `src/lib/utils/constants.ts`.

## Security Model

```
┌─────────────────────────────────────────────┐
│              REQUEST LIFECYCLE               │
├─────────────────────────────────────────────┤
│                                              │
│  1. HTTPS (Vercel enforced)                  │
│  2. Next.js Proxy (src/proxy.ts)             │
│     └── Session refresh via updateSession    │
│         (Supabase JWT in cookies)            │
│     └── Route protection (redirect to /login)│
│  3. API Route                                │
│     └── supabase.auth.getUser() (defense in  │
│         depth — re-validates the user)       │
│     └── Upstash rate limit check             │
│     └── Zod input validation                 │
│  4. Database                                 │
│     └── RLS policies on ALL tables           │
│     └── User can only see own rows           │
│     └── Service role (admin client) used     │
│         only server-side; bypasses RLS       │
│                                              │
└──────────────────────────────────────────────┘
```

> Note: In Next.js 16 the former `middleware.ts` is exported as `proxy` from
> `src/proxy.ts`. Session logic lives in `src/lib/db/supabase/middleware.ts`
> (`updateSession`).

## Database Schema Relationships

```
auth.users (Supabase managed)
    │ 1:1
    ▼
profiles (id, email, full_name, avatar_url)
    │ 1:N
    ▼
documents (id, user_id, title, status, summary)
    │         │
    │ 1:N     │ 1:N
    ▼         ▼
document_chunks    conversations
(id, embedding,        │ 1:N
 content, page_number) ▼
                   messages
                   (id, role, content,
                    citations, latency_ms)
```

- `documents.status` ∈ `uploaded | processing | ready | error`.
- `document_chunks.embedding` is `vector(3072)`; other columns include
  `chunk_index`, `page_number`, `token_count`, `metadata`.
- Multi-document chat adds `conversations.document_ids uuid[]` and the
  `match_multiple_document_chunks` function
  (`supabase/migrations/20260611_multi_document_chat.sql`).
- After any schema change, run `npm run db:types` to regenerate
  `src/types/database.ts`.

## Multi-provider AI routing

See `docs/ADAPTIVE_AI_ROUTING.md`. The registry separates direct providers from gateways, filters configuration/capability/health, permits at most two sequential providers, preserves pre-token-only fallback, reuses shared Upstash circuits, and maintains Gemini embedding/OCR affinity. Cohere reranking is optional, bounded, reorder-only, and fail-open.
