# Entity-Relationship Diagram

This diagram represents the main tables in the Research AI database schema.

> Source of truth: kept in sync with `src/types/database.ts` and
> `supabase/migrations/`. If code and this doc disagree, the code wins.
> Regenerate types after any schema change: `npm run db:types`.

```mermaid
erDiagram
    profiles ||--o{ documents : "user_id"
    profiles ||--o{ conversations : "user_id"
    documents ||--o{ document_chunks : "document_id"
    documents ||--o{ conversations : "document_id (single-doc)"
    conversations ||--o{ messages : "conversation_id"

    profiles {
        uuid id PK "references auth.users"
        text email
        text full_name
        text avatar_url
        timestamptz created_at
        timestamptz updated_at
    }

    documents {
        uuid id PK
        uuid user_id FK
        text title
        text file_name
        text file_path
        bigint file_size
        text mime_type
        text status "uploaded, processing, ready, error"
        text summary
        integer page_count
        jsonb metadata
        timestamptz created_at
        timestamptz updated_at
    }

    document_chunks {
        uuid id PK
        uuid document_id FK
        text content
        integer chunk_index
        integer page_number
        integer token_count
        vector embedding "3072 dims"
        jsonb metadata
        timestamptz created_at
    }

    conversations {
        uuid id PK
        uuid user_id FK
        uuid document_id FK "nullable (single-doc chat)"
        uuid_array document_ids "nullable (multi-doc chat)"
        text title
        timestamptz created_at
        timestamptz updated_at
    }

    messages {
        uuid id PK
        uuid conversation_id FK
        text role "user, assistant, system"
        text content
        jsonb citations
        jsonb token_usage
        integer latency_ms
        timestamptz created_at
    }
```

## Notes

- **Single-doc vs multi-doc chat.** A `conversation` links to a document one of
  two ways: `document_id` (a single document, real FK) or `document_ids uuid[]`
  (multiple documents, added by the multi-document chat migration). `document_id`
  is nullable — a multi-doc conversation may leave it null and populate
  `document_ids` instead. The array column has no FK constraint, so document
  deletes are not cascaded through it.
- **Vector search.** `document_chunks.embedding` is `vector(3072)`
  (`gemini-embedding-001`). Similarity search runs through the
  `match_document_chunks` (single-doc) and `match_multiple_document_chunks`
  (multi-doc) SQL functions using cosine distance (`<=>`). No ANN index is
  defined on the column — see `docs/ARCHITECTURE.md`, Stage 4.
- **RLS.** Every table is user-scoped via Row Level Security; `profiles.id`
  is a 1:1 reference to `auth.users`, auto-created on signup by the
  `handle_new_user()` trigger.
- **Multi-doc migration:** `supabase/migrations/20260611_multi_document_chat.sql`
  adds `conversations.document_ids` and drops the `NOT NULL` on `document_id`.
