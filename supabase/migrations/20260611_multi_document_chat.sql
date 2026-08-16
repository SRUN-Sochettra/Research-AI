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