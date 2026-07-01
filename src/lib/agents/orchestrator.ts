import { parsePDF } from "./pdf-parser";
import { chunkDocument } from "./chunker";
import { embedChunks } from "./embedder";
import { summarizeDocument } from "./summarizer";
import {
  updateDocumentStatus,
  saveChunks,
} from "@/lib/db/queries/documents";

export interface PipelineOptions { documentId: string; userId: string; buffer: Buffer; onProgress?: (stage: PipelineStage, message: string) => void; }

export type PipelineStage =
  | "parsing"
  | "chunking"
  | "embedding"
  | "storing"
  | "summarizing"
  | "done"
  | "error";

export interface PipelineResult {
  success: boolean;
  pageCount: number;
  chunkCount: number;
  summary: string;
  error?: string;
}

export async function runDocumentPipeline(
  options: PipelineOptions
): Promise<PipelineResult> {
  const { documentId, userId, buffer, onProgress } = options;

  const log = (stage: PipelineStage, message: string) => {
    console.log(`[Pipeline:${documentId}] [${stage}] ${message}`);
    onProgress?.(stage, message);
  };

  try {
    // ─── STAGE 1: Parse PDF ──────────────────────────────
    log("parsing", "Extracting text from PDF...");
    await updateDocumentStatus(documentId, "processing");

    const parsed = await parsePDF(buffer);
    log(
      "parsing",
      `Extracted ${parsed.pageCount} pages, ${parsed.text.length} characters`
    );

    // ─── STAGE 2: Chunk Text ─────────────────────────────
    log("chunking", "Splitting document into chunks...");

    const chunks = await chunkDocument(parsed, documentId);
    log("chunking", `Created ${chunks.length} chunks`);

    // ─── STAGE 3: Generate Embeddings ───────────────────
    log("embedding", `Generating embeddings for ${chunks.length} chunks...`);

    const embeddedChunks = await embedChunks(chunks);
    log("embedding", `Generated ${embeddedChunks.length} embeddings`);

    // ─── STAGE 4: Store in Vector DB ────────────────────
    log("storing", "Saving vectors to database...");

    await saveChunks(documentId, embeddedChunks);
    log("storing", "Chunks saved successfully");

    // ─── STAGE 5: Summarize ──────────────────────────────
    log("summarizing", "Generating document summary...");

    const summary = await summarizeDocument(chunks, userId, documentId);
    log("summarizing", "Summary generated");

    // ─── DONE ────────────────────────────────────────────
    await updateDocumentStatus(documentId, "ready", {
      pageCount: parsed.pageCount,
      summary,
      metadata: {
        pdfMetadata: parsed.metadata,
        chunkCount: chunks.length,
        processedAt: new Date().toISOString(),
      },
    });

    log("done", "Pipeline ready");

    return {
      success: true,
      pageCount: parsed.pageCount,
      chunkCount: chunks.length,
      summary,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown pipeline error";

    console.error(`[Pipeline:${documentId}] Error:`, error);

    // Mark document as error
    await updateDocumentStatus(documentId, "error", {
      metadata: {
        error: errorMessage,
        erroredAt: new Date().toISOString(),
      },
    }).catch(console.error); // Don't throw if status update fails

    log("error", errorMessage);

    return {
      success: false,
      pageCount: 0,
      chunkCount: 0,
      summary: "",
      error: errorMessage,
    };
  }
}