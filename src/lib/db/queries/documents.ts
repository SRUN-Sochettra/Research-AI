import { getSupabaseAdminClient } from "@/lib/db/supabase/admin";
import { getSupabaseServerClient } from "@/lib/db/supabase/server";
import type { Document, DocumentStatus, Json } from "@/types/database";
import type { EmbeddedChunk } from "@/lib/agents/embedder";

// ============================================
// Document CRUD
// ============================================

export async function createDocument(data: {
  userId: string;
  title: string;
  filePath: string;
  fileName: string; // ← added
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
      file_name: data.fileName,
      file_size: data.fileSize,
      mime_type: data.fileType,
      status: "uploaded", // ← was: "pending"
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
        metadata: extra.metadata as unknown as Json,
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
    await supabase.storage.from("documents").remove([doc.file_path]);
  }

  // Clean up multi-document conversations that reference this document
  const { data: multiConvs } = await supabase
    .from("conversations")
    .select("id, document_ids")
    .eq("user_id", userId)
    .contains("document_ids", [documentId]);

  if (multiConvs && multiConvs.length > 0) {
    for (const conv of multiConvs) {
      const remaining = (conv.document_ids || []).filter(
        (id: string) => id !== documentId
      );
      if (remaining.length === 0) {
        await supabase.from("conversations").delete().eq("id", conv.id);
      } else {
        await supabase
          .from("conversations")
          .update({ document_ids: remaining })
          .eq("id", conv.id);
      }
    }
  }

  // Delete document (cascades to chunks, single-doc conversations, messages)
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
    metadata: chunk.metadata as unknown as Json,
  }));

  // Bulk insert in batches of 50 to avoid payload limits
  const BATCH_SIZE = 50;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const { error } = await supabase.from("document_chunks").insert(batch);

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

export async function getUserDocumentCount(userId: string): Promise<number> {
  const supabase = getSupabaseAdminClient();

  const { count, error } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .neq("status", "error");

  if (error) return 0;
  return count ?? 0;
}
export async function updateDocumentTitle(
  documentId: string,
  userId: string,
  newTitle: string
): Promise<void> {
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from("documents")
    .update({ title: newTitle, updated_at: new Date().toISOString() })
    .eq("id", documentId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to update document title: ${error.message}`);
  }
}

export async function searchMultipleSimilarChunks(
  documentIds: string[],
  queryEmbedding: number[],
  options?: {
    threshold?: number;
    count?: number;
  }
): Promise<
  {
    id: string;
    document_id: string;
    content: string;
    page_number: number | null;
    similarity: number;
  }[]
> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase.rpc("match_multiple_document_chunks", {
    query_embedding: queryEmbedding,
    match_document_ids: documentIds,
    match_threshold: options?.threshold ?? 0.7,
    match_count: options?.count ?? 5,
  });

  if (error) {
    throw new Error(`Vector multiple search failed: ${error.message}`);
  }

  return data ?? [];
}
