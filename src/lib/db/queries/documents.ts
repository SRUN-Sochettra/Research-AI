import { getSupabaseAdminClient } from "@/lib/db/supabase/admin";
import { getSupabaseServerClient } from "@/lib/db/supabase/server";
import type {
  Document,
  DocumentStatus,
} from "@/types/database";
import type { EmbeddedChunk } from "@/lib/agents/embedder";

// ============================================
// Document CRUD
// ============================================

export async function createDocument(data: {
  userId: string;
  title: string;
  filePath: string;
  fileSize: number;
  fileType: string;
}): Promise<Document> {
  const supabase = getSupabaseAdminClient();

  const { data: document, error } = await supabase
    .from("documents")
    .insert({
      user_id: data.userId,
      title: data.title,
      file_path: data.filePath,
      size: data.fileSize,
      file_type: data.fileType,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create document record: ${error.message}`);
  }

  return document;
}

export async function updateDocumentStatus(
  documentId: string,
  status: DocumentStatus,
  extra?: {
    pageCount?: number;
    summary?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from("documents")
    .update({
      status,
      ...(extra?.pageCount !== undefined && {
        page_count: extra.pageCount,
      }),
      ...(extra?.summary !== undefined && {
        summary: extra.summary,
      }),
      ...(extra?.metadata !== undefined && {
        metadata: extra.metadata as any,
      }),
    })
    .eq("id", documentId);

  if (error) {
    throw new Error(`Failed to update document status: ${error.message}`);
  }
}

export async function getDocumentById(
  documentId: string,
  userId: string
): Promise<Document | null> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data;
}

export async function deleteDocument(
  documentId: string,
  userId: string
): Promise<void> {
  const supabase = getSupabaseAdminClient();

  // Get file path first
  const { data: doc } = await supabase
    .from("documents")
    .select("file_path")
    .eq("id", documentId)
    .eq("user_id", userId)
    .single();

  if (doc?.file_path) {
    // Delete from storage
    await supabase.storage
      .from("documents")
      .remove([doc.file_path]);
  }

  // Delete document (cascades to chunks, conversations, messages)
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}

// ============================================
// Chunk operations
// ============================================

export async function saveChunks(
  documentId: string,
  chunks: EmbeddedChunk[]
): Promise<void> {
  const supabase = getSupabaseAdminClient();

  // Prepare rows for bulk insert
  const rows = chunks.map((chunk) => ({
    document_id: documentId,
    chunk_index: chunk.chunkIndex,
    content: chunk.content,
    page_number: chunk.pageNumber,
    token_count: chunk.tokenCount,
    embedding: chunk.embedding,
    metadata: chunk.metadata as any,
  }));

  // Bulk insert in batches of 50 to avoid payload limits
  const BATCH_SIZE = 50;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .from("document_chunks")
      .insert(batch);

    if (error) {
      throw new Error(
        `Failed to save chunks batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`
      );
    }
  }
}

// Semantic similarity search
export async function searchSimilarChunks(
  documentId: string,
  queryEmbedding: number[],
  options?: {
    threshold?: number;
    count?: number;
  }
): Promise<
  {
    id: string;
    content: string;
    page_number: number | null;
    similarity: number;
  }[]
> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: queryEmbedding,
    match_document_id: documentId,
    match_threshold: options?.threshold ?? 0.7,
    match_count: options?.count ?? 5,
  });

  if (error) {
    throw new Error(`Vector search failed: ${error.message}`);
  }

  return data ?? [];
}

// ============================================
// User document count (enforce limits)
// ============================================

export async function getUserDocumentCount(
  userId: string
): Promise<number> {
  const supabase = getSupabaseAdminClient();

  const { count, error } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .neq("status", "failed");

  if (error) return 0;
  return count ?? 0;
}