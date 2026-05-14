import { getChatModel } from "@/lib/ai/gemini";
import { QA_PROMPT } from "@/lib/ai/prompts";
import { retrieveRelevantChunks, formatChunksAsContext } from "./retriever";
import { reformulateQuery, formatConversationHistory } from "./query-reformulator";
import { logger } from "@/lib/observability/logger";
import type { RetrievedChunk } from "./retriever";
import type { Message } from "@/types/database";

export interface QAResult {
  answer: string;
  citations: {
    chunk_id: string;
    text: string;
    documentId: string;
    pageNumber: number | null;
    snippet: string;
    similarity: number;
  }[];
  retrievedChunks: RetrievedChunk[];
  reformulatedQuery: string;
  tokenUsage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface QAStreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (result: QAResult) => void;
  onError: (error: Error) => void;
}

export async function runQAAgent(
  question: string,
  documentId: string,
  conversationHistory: Message[],
  callbacks: QAStreamCallbacks
): Promise<void> {
  const startTime = Date.now();

  try {
    logger.info("[QAAgent] Starting QA pipeline", {
      documentId,
      questionLength: question.length,
      historyLength: conversationHistory.length,
    });

    // ─── Step 1: Reformulate Query ─────────────────────
    const reformulatedQuery = await reformulateQuery(
      question,
      conversationHistory
    );

    // ─── Step 2: Retrieve Relevant Chunks ──────────────
    const { chunks } = await retrieveRelevantChunks(
      reformulatedQuery,
      documentId
    );

    if (chunks.length === 0) {
      // Fallback: try with lower threshold
      logger.warn("[QAAgent] No chunks found, retrying with lower threshold");
      const fallback = await retrieveRelevantChunks(
        reformulatedQuery,
        documentId,
        { threshold: 0.5, count: 3 }
      );
      chunks.push(...fallback.chunks);
    }

    // ─── Step 3: Format Context ─────────────────────────
    const context = formatChunksAsContext(chunks);
    const chatHistory = formatConversationHistory(conversationHistory);

    // ─── Step 4: Stream LLM Response ───────────────────
    const model = getChatModel({
      temperature: 0.3,
      streaming: true,
    });

    const chain = QA_PROMPT.pipe(model);

    let fullAnswer = "";

    // Stream tokens to client
    const stream = await chain.stream({
      context,
      chat_history: chatHistory,
      question,
    });

    for await (const chunk of stream) {
      const token = chunk.content as string;
      if (token) {
        fullAnswer += token;
        callbacks.onToken(token);
      }
    }

    // ─── Step 5: Build Citations ────────────────────────
    const citations = buildCitations(chunks, fullAnswer, documentId);

    const latencyMs = Date.now() - startTime;

    logger.info("[QAAgent] Pipeline complete", {
      documentId,
      latencyMs,
      citationCount: citations.length,
      answerLength: fullAnswer.length,
    });

    callbacks.onComplete({
      answer: fullAnswer,
      citations,
      retrievedChunks: chunks,
      reformulatedQuery,
    });
  } catch (error) {
    logger.error(
      "[QAAgent] Pipeline failed",
      error instanceof Error ? error : new Error("Unknown error"),
      { documentId }
    );
    callbacks.onError(
      error instanceof Error ? error : new Error("QA pipeline failed")
    );
  }
}

// Build citation objects from retrieved chunks
function buildCitations(
  chunks: RetrievedChunk[],
  answer: string,
  documentId: string
): QAResult["citations"] {
  return chunks
    .filter((chunk) => chunk.similarity > 0.6) // Only cite relevant chunks
    .map((chunk) => ({
      chunk_id: chunk.id,
      text: chunk.content,
      documentId,
      pageNumber: chunk.pageNumber,
      // Extract a meaningful snippet (first 200 chars)
      snippet: chunk.content
        .slice(0, 200)
        .trim()
        .replace(/\s+/g, " "),
      similarity: Math.round(chunk.similarity * 100) / 100,
    }));
}