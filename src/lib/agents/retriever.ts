import { embedQuery } from "./embedder";
import {
  searchSimilarChunks,
  searchMultipleSimilarChunks,
} from "@/lib/db/queries/documents";
import { AI_CONFIG } from "@/lib/utils/constants";
import { logger } from "@/lib/observability/logger";

export interface RetrievedChunk {
  id: string;
  documentId?: string;
  content: string;
  pageNumber: number | null;
  similarity: number;
}

export interface RetrievalResult {
  chunks: RetrievedChunk[];
  query: string; // The actual query used for retrieval
}

export async function retrieveRelevantChunks(
  query: string,
  documentId: string,
  options?: {
    threshold?: number;
    count?: number;
  }
): Promise<RetrievalResult> {
  logger.info("[Retriever] Starting retrieval", {
    documentId,
    queryLength: query.length,
  });

  // 1. Embed the query
  const queryEmbedding = await embedQuery(query);

  // 2. Semantic search against pgvector
  const rawChunks = await searchSimilarChunks(documentId, queryEmbedding, {
    threshold: options?.threshold ?? AI_CONFIG.similarityThreshold,
    count: options?.count ?? AI_CONFIG.maxRetrievedChunks,
  });

  logger.info("[Retriever] Retrieved chunks", {
    documentId,
    chunkCount: rawChunks.length,
    topSimilarity: rawChunks[0]?.similarity ?? 0,
  });

  // 3. Format for use in prompt
  const chunks: RetrievedChunk[] = rawChunks.map((chunk) => ({
    id: chunk.id,
    content: chunk.content,
    pageNumber: chunk.page_number,
    similarity: chunk.similarity,
  }));

  return { chunks, query };
}

export async function retrieveMultipleDocumentsChunks(
  query: string,
  documentIds: string[],
  options?: {
    threshold?: number;
    count?: number;
  }
): Promise<RetrievalResult> {
  logger.info("[Retriever] Starting multi-document retrieval", {
    documentIds,
    queryLength: query.length,
  });

  const queryEmbedding = await embedQuery(query);

  const rawChunks = await searchMultipleSimilarChunks(
    documentIds,
    queryEmbedding,
    {
      threshold: options?.threshold ?? AI_CONFIG.similarityThreshold,
      count: options?.count ?? AI_CONFIG.maxRetrievedChunks,
    }
  );

  logger.info("[Retriever] Retrieved chunks", {
    documentIds,
    chunkCount: rawChunks.length,
    topSimilarity: rawChunks[0]?.similarity ?? 0,
  });

  const chunks: RetrievedChunk[] = rawChunks.map((chunk) => ({
    id: chunk.id,
    documentId: chunk.document_id,
    content: chunk.content,
    pageNumber: chunk.page_number,
    similarity: chunk.similarity,
  }));

  return { chunks, query };
}

// Format chunks into a readable context string for the LLM
export function formatChunksAsContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return "No relevant context found in the document.";
  }

  return chunks
    .map((chunk, index) => {
      const pageRef = chunk.pageNumber ? ` (Page ${chunk.pageNumber})` : "";
      return `[Source ${index + 1}${pageRef}]:\n${chunk.content}`;
    })
    .join("\n\n---\n\n");
}
