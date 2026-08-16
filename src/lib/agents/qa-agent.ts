import { CallbackHandler } from "@/lib/observability/langfuse-callback";
import { getChatModel, createChatModelSelector } from "@/lib/ai/gemini";
import { QA_PROMPT } from "@/lib/ai/prompts";
import {
  retrieveRelevantChunks,
  retrieveMultipleDocumentsChunks,
  formatChunksAsContext,
} from "./retriever";
import {
  reformulateQuery,
  formatConversationHistory,
} from "./query-reformulator";
import { logger } from "@/lib/observability/logger";
import { AI_CONFIG } from "@/lib/utils/constants";
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

function isRateLimitError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("429") ||
      error.message.includes("Too Many Requests") ||
      error.message.includes("quota"))
  );
}

export async function runQAAgent(
  question: string,
  userId: string,
  conversationId: string,
  conversationHistory: Message[],
  callbacks: QAStreamCallbacks,
  documentId?: string,
  documentIds?: string[]
): Promise<void> {
  const startTime = Date.now();
  let currentStage = "initialization";
  let currentModel: string = AI_CONFIG.chatModel;

  try {
    logger.info("[QAAgent] Starting QA pipeline", {
      documentId: documentId || documentIds?.[0],
      questionLength: question.length,
      historyLength: conversationHistory.length,
    });

    // ─── Step 1: Reformulate Query ─────────────────────
    currentStage = "query-reformulation";
    currentModel = AI_CONFIG.chatModel;
    const reformulatedQuery = await reformulateQuery(
      question,
      conversationHistory,
      userId,
      conversationId
    );

    // ─── Step 2: Retrieve Relevant Chunks ──────────────
    currentStage = "retrieval";
    currentModel = AI_CONFIG.embeddingModel;
    let chunks: RetrievedChunk[] = [];
    if (documentIds && documentIds.length > 0) {
      const result = await retrieveMultipleDocumentsChunks(
        reformulatedQuery,
        documentIds
      );
      chunks = result.chunks;

      if (chunks.length === 0) {
        logger.warn("[QAAgent] No chunks found, retrying with lower threshold");
        const fallback = await retrieveMultipleDocumentsChunks(
          reformulatedQuery,
          documentIds,
          { threshold: 0.5, count: 3 }
        );
        chunks.push(...fallback.chunks);
      }
    } else if (documentId) {
      const result = await retrieveRelevantChunks(
        reformulatedQuery,
        documentId as string
      );
      chunks = result.chunks;

      if (chunks.length === 0) {
        logger.warn("[QAAgent] No chunks found, retrying with lower threshold");
        const fallback = await retrieveRelevantChunks(
          reformulatedQuery,
          documentId as string,
          { threshold: 0.5, count: 3 }
        );
        chunks.push(...fallback.chunks);
      }
    } else {
      throw new Error("Either documentId or documentIds must be provided");
    }

    // ─── Step 3: Format Context ─────────────────────────
    currentStage = "format-context";
    const context = formatChunksAsContext(chunks);
    const chatHistory = formatConversationHistory(conversationHistory);

    // ─── Step 4: Stream LLM Response (with model fallback) ─────
    currentStage = "llm-generation";
    const langfuseHandler = new CallbackHandler({
      sessionId: conversationId,
      userId: userId,
      tags: ["qa"],
    });

    const selector = createChatModelSelector();
    let fullAnswer = "";

    while (true) {
      currentModel = selector.current();
      const model = getChatModel({
        temperature: 0.3,
        streaming: true,
        modelOverride: currentModel,
      });

      const chain = QA_PROMPT.pipe(model);
      let tokensEmitted = false;

      try {
        const stream = await chain.stream(
          {
            context,
            chat_history: chatHistory,
            question,
          },
          { callbacks: [langfuseHandler] }
        );

        for await (const chunk of stream) {
          const token = chunk.content as string;
          if (token) {
            tokensEmitted = true;
            fullAnswer += token;
            callbacks.onToken(token);
          }
        }

        break; // stream completed successfully
      } catch (error) {
        // Only safe to fail over if nothing has been sent to the client yet.
        if (isRateLimitError(error) && !tokensEmitted) {
          const nextModel = selector.next();
          if (nextModel) {
            logger.warn("[QAAgent] Chat hit rate limit, switching model", {
              stage: currentStage,
              previousModel: currentModel,
              nextModel,
            });
            fullAnswer = "";
            continue;
          }
          logger.warn("[QAAgent] All chat models exhausted", {
            stage: currentStage,
          });
        }
        throw error;
      }
    }

    // ─── Step 5: Build Citations ────────────────────────
    currentStage = "citation-building";
    const citations = buildCitations(
      chunks,
      (documentId || documentIds?.[0] || "") as string
    );

    const latencyMs = Date.now() - startTime;

    logger.info("[QAAgent] Pipeline complete", {
      documentId: documentId || documentIds?.[0] || "",
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
      error instanceof Error ? error : new Error("QA pipeline failed"),
      {
        stage: currentStage,
        model: currentModel,
        documentId: documentId || documentIds?.[0],
      }
    );
    callbacks.onError(
      error instanceof Error ? error : new Error("QA pipeline failed")
    );
  }
}

// Build citation objects from retrieved chunks
function buildCitations(
  chunks: RetrievedChunk[],
  defaultDocumentId: string
): QAResult["citations"] {
  return chunks
    .filter((chunk) => chunk.similarity > 0.6) // Only cite relevant chunks
    .map((chunk) => ({
      chunk_id: chunk.id,
      text: chunk.content,
      documentId: chunk.documentId || defaultDocumentId,
      pageNumber: chunk.pageNumber,
      // Extract a meaningful snippet (first 200 chars)
      snippet: chunk.content.slice(0, 200).trim().replace(/\s+/g, " "),
      similarity: Math.round(chunk.similarity * 100) / 100,
    }));
}
