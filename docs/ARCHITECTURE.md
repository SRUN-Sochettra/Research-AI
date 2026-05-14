# Architecture Deep Dive

## RAG Pipeline

The Retrieval-Augmented Generation pipeline has 5 distinct stages:

### Stage 1: PDF Parsing
```
Input:  Raw PDF buffer
Output: Extracted text + page-level text array

Tool:   pdf-parse library
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
Output: EmbeddedChunk array (with vector[768])

Model:  text-embedding-004 (Gemini)
Batch:  10 chunks per API call
Retry:  Exponential backoff (3 attempts)
```

### Stage 4: Vector Storage
```
Input:  EmbeddedChunk array
Output: Rows in document_chunks table

Extension: pgvector
Index:     IVFFlat (cosine similarity)
Bulk insert: 50 rows per batch
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
```

## Q&A Pipeline

```
User Question
    │
    ▼
Query Reformulation (if history exists)
    │ Standalone question for retrieval
    ▼
Query Embedding (Gemini text-embedding-004)
    │ vector[768]
    ▼
pgvector Similarity Search
    │ SELECT ... ORDER BY embedding <=> query_embedding
    │ WHERE similarity > 0.7 LIMIT 5
    ▼
Context Formatting
    │ [Source 1 (Page 3)]: ...text...
    │ [Source 2 (Page 7)]: ...text...
    ▼
Gemini Generation (streaming)
    │ Prompt = system + context + history + question
    ▼
SSE Stream to Client
    │ token by token
    ▼
Citation Extraction + DB Persistence
```

## Security Model

```
┌─────────────────────────────────────────────┐
│              REQUEST LIFECYCLE              │
├─────────────────────────────────────────────┤
│                                             │
│  1. HTTPS (Vercel enforced)                 │
│  2. Next.js Middleware                      │
│     └── JWT validation via Supabase         │
│     └── Route protection (redirect to /login)│
│  3. API Route                               │
│     └── Re-validate JWT (defense in depth)  │
│     └── Upstash rate limit check            │
│     └── Zod input validation                │
│  4. Database                                │
│     └── RLS policies on ALL tables          │
│     └── User can only see own rows          │
│     └── Service role used only server-side  │
│                                             │
└─────────────────────────────────────────────┘
```

## Database Schema Relationships

```
auth.users (Supabase managed)
    │ 1:1
    ▼
profiles (id, email, tier, usage_count)
    │ 1:N
    ▼
documents (id, user_id, title, status, summary)
    │         │
    │ 1:N     │ 1:N
    ▼         ▼
document_chunks    conversations
(id, embedding,        │ 1:N
 content, page_num)    ▼
                   messages
                   (id, role, content,
                    citations, latency_ms)
```