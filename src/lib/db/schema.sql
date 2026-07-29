-- ============================================================================
-- Research AI — Canonical Database Schema
-- ============================================================================
-- Run this in the Supabase SQL Editor on a fresh project.
--
-- Source of truth: reconstructed from src/types/database.ts, the README
-- "Database Setup" SQL, and supabase/migrations/. This file supersedes the
-- previously EMPTY src/lib/db/schema.sql.
--
-- ⚠️ SECURITY NOTE: The original README SQL created the tables but never
-- enabled Row Level Security or added policies on the application tables —
-- despite the docs claiming "RLS on ALL tables". Section 6 below adds the
-- RLS enablement + policies that the documented security model REQUIRES.
-- Without them, the RLS-scoped server client does NOT actually isolate users.
-- Review Section 6 before running against an existing database.
--
-- ✅ VERIFIED 2026-07-28 against the live project (ref jfaevdbmgqvpuewdggql):
-- RLS is ENABLED on all five tables, the policies below are DEPLOYED, and an
-- unauthenticated anon-key SELECT on public.documents returns 0 rows (proof
-- that isolation works). Section 6 was rewritten to match what is actually
-- deployed (consolidated `for all` policies), not the earlier per-command
-- draft — prod is the source of truth.
-- ============================================================================


-- ─── 1. Extensions ──────────────────────────────────────────────────────────
create extension if not exists vector;


-- ─── 2. Tables ──────────────────────────────────────────────────────────────

-- profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- documents
create table if not exists public.documents (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  file_name  text not null,
  file_path  text not null,
  file_size  bigint not null,
  mime_type  text not null,
  page_count integer,
  status     text not null default 'uploaded'
             check (status in ('uploaded', 'processing', 'ready', 'error')),
  summary    text,
  metadata   jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- document_chunks (embedding is 3072-dim: gemini-embedding-001)
create table if not exists public.document_chunks (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  content     text not null,
  chunk_index integer not null,
  page_number integer,
  token_count integer not null,
  embedding   vector(3072),
  metadata    jsonb,
  created_at  timestamptz default now()
);

-- conversations
-- document_id: single-doc chat (nullable). document_ids: multi-doc chat (array,
-- no FK — deletes are NOT cascaded through it).
create table if not exists public.conversations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  document_id  uuid references public.documents(id) on delete cascade,
  document_ids uuid[],
  title        text not null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- messages
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant', 'system')),
  content         text not null,
  citations       jsonb,
  token_usage     jsonb,
  latency_ms      integer,
  created_at      timestamptz default now()
);


-- ─── 3. Indexes ─────────────────────────────────────────────────────────────
-- Foreign-key / lookup indexes for common access patterns.
create index if not exists idx_documents_user_id
  on public.documents (user_id);
create index if not exists idx_document_chunks_document_id
  on public.document_chunks (document_id);
create index if not exists idx_conversations_user_id
  on public.conversations (user_id);
create index if not exists idx_messages_conversation_id
  on public.messages (conversation_id);

-- NOTE: No ANN (ivfflat/hnsw) index on document_chunks.embedding.
-- pgvector's ivfflat/hnsw cap at 2000 dimensions, and this column is 3072,
-- so those indexes cannot be built directly. Similarity search therefore runs
-- as an exact sequential cosine scan (fine at portfolio scale). To index later,
-- switch to halfvec(3072) or reduce dimensionality. See docs/ARCHITECTURE.md.


-- ─── 4. Vector similarity search functions ─────────────────────────────────

-- Single-document search
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

-- Multi-document search (from 20260611_multi_document_chat.sql)
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


-- ─── 5. Auth trigger: auto-create profile on signup ────────────────────────
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();


-- ============================================================================
-- 6. ROW LEVEL SECURITY  (✅ VERIFIED DEPLOYED — matches live project)
-- ============================================================================
-- The app's per-user isolation depends on these. The service-role admin client
-- (src/lib/db/supabase/admin.ts) bypasses RLS by design for pipeline writes
-- (createDocument, saveChunks, saveMessage, status updates, deletes); the
-- RLS-scoped server client (server.ts) relies on the policies below.
--
-- DESIGN NOTES on the policy shape (why it differs from a naive per-command set):
--   • documents / conversations / messages use a single `for all` policy each.
--     Because `qual` (USING) applies to SELECT/UPDATE/DELETE and doubles as the
--     default for INSERT when no WITH CHECK is given, one owner-scoped policy
--     covers every operation the authenticated user is allowed to perform.
--   • document_chunks is SELECT-only for authenticated users: chunk WRITES go
--     exclusively through the service-role admin client, so no authed
--     insert/update policy is granted on purpose (least privilege).
--   • profiles INSERT is handled by the handle_new_user() SECURITY DEFINER
--     trigger (§5), which bypasses RLS — so profiles only needs SELECT + UPDATE
--     policies for the user themselves.
--   • messages / document_chunks isolate via the parent row's owner (a subquery
--     against conversations / documents), since neither table has its own
--     user_id column.

alter table public.profiles         enable row level security;
alter table public.documents        enable row level security;
alter table public.document_chunks  enable row level security;
alter table public.conversations    enable row level security;
alter table public.messages         enable row level security;

-- profiles: a user can see and update only their own row
create policy "Users view own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "Users update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- documents: owner-scoped, all operations
create policy "Users view own documents" on public.documents
  for all to authenticated using (auth.uid() = user_id);

-- conversations: owner-scoped, all operations
create policy "Users view own conversations" on public.conversations
  for all to authenticated using (auth.uid() = user_id);

-- messages: access allowed only via the parent conversation's owner
create policy "Users view own messages" on public.messages
  for all to authenticated using (
    conversation_id in (
      select conversations.id
      from public.conversations
      where conversations.user_id = auth.uid()
    )
  );

-- document_chunks: SELECT only, via the parent document's owner.
-- (Writes happen through the service-role admin client, which bypasses RLS.)
create policy "Users view own chunks" on public.document_chunks
  for select to authenticated using (
    document_id in (
      select documents.id
      from public.documents
      where documents.user_id = auth.uid()
    )
  );


-- ─── 7. Storage bucket policies ─────────────────────────────────────────────
-- First create a PRIVATE bucket named 'documents' in Supabase → Storage,
-- then run these. Files are namespaced per user: <user_id>/<file>.
-- ✅ VERIFIED DEPLOYED: the three policies below exist in the `storage` schema.

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

-- ============================================================================
-- End of schema. After running, regenerate app types:  npm run db:types
-- ============================================================================
