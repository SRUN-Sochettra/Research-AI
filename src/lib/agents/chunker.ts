import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { AI_CONFIG } from "@/lib/utils/constants";
import type { ParsedPDF } from "./pdf-parser";

export interface TextChunk {
  content: string;
  chunkIndex: number;
  pageNumber: number | null;
  tokenCount: number;
  metadata: Record<string, unknown>;
}

export async function chunkDocument(
  parsed: ParsedPDF,
  documentId: string
): Promise<TextChunk[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: AI_CONFIG.chunkSize,
    chunkOverlap: AI_CONFIG.chunkOverlap,
    // Split on these separators in order of preference
    separators: ["\n\n", "\n", ". ", "! ", "? ", " ", ""],
  });

  // Strategy: chunk per-page for better citation accuracy
  // Fall back to full-text chunking if pages aren't available
  const allChunks: TextChunk[] = [];
  let globalChunkIndex = 0;

  if (parsed.pages.length > 1) {
    // Per-page chunking - preserves page number accuracy
    for (let pageIndex = 0; pageIndex < parsed.pages.length; pageIndex++) {
      const pageText = parsed.pages[pageIndex];

      if (!pageText || pageText.trim().length < 20) continue;

      const pageChunks = await splitter.createDocuments([pageText], [
        {
          pageNumber: pageIndex + 1,
          documentId,
        },
      ]);

      for (const chunk of pageChunks) {
        if (chunk.pageContent.trim().length < 20) continue;

        allChunks.push({
          content: chunk.pageContent.trim(),
          chunkIndex: globalChunkIndex++,
          pageNumber: pageIndex + 1,
          tokenCount: estimateTokenCount(chunk.pageContent),
          metadata: {
            documentId,
            pageNumber: pageIndex + 1,
            source: `page_${pageIndex + 1}`,
          },
        });
      }
    }
  } else {
    // Full-text chunking fallback
    const chunks = await splitter.createDocuments([parsed.text]);

    for (const chunk of chunks) {
      if (chunk.pageContent.trim().length < 20) continue;

      allChunks.push({
        content: chunk.pageContent.trim(),
        chunkIndex: globalChunkIndex++,
        pageNumber: null,
        tokenCount: estimateTokenCount(chunk.pageContent),
        metadata: {
          documentId,
          source: "full_text",
        },
      });
    }
  }

  if (allChunks.length === 0) {
    throw new Error(
      "No usable chunks could be extracted from this document."
    );
  }

  return allChunks;
}

// Rough token estimation (4 chars ≈ 1 token)
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}