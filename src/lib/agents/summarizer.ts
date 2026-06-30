import { CallbackHandler } from "langfuse-langchain";
// src/lib/agents/summarizer.ts
import {
  getChatModel,
  switchToNextModel,
  resetModelSelection,
  getCurrentChatModelName,
} from "@/lib/ai/gemini";
import { MAP_PROMPT, REDUCE_PROMPT, SUMMARY_PROMPT } from "@/lib/ai/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import type { TextChunk } from "./chunker";

const MAX_DIRECT_SUMMARY_TOKENS = 3000;
const MAX_CHUNK_TOKENS_FOR_MAP = 500;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 30000;

export async function summarizeDocument(chunks: TextChunk[], userId: string, documentId: string): Promise<string> {
  // Reset to primary model at the start of each summarization
  resetModelSelection();

  const outputParser = new StringOutputParser();

  const totalTokens = chunks.reduce(
    (sum, chunk) => sum + chunk.tokenCount,
    0
  );

  if (totalTokens <= MAX_DIRECT_SUMMARY_TOKENS) {
    return await directSummarize(chunks.map((c) => c.content).join("\n\n"), outputParser, userId, documentId);
  }

  return await mapReduceSummarize(chunks, outputParser, userId, documentId);
}

// Invoke with retry + automatic model fallback on 429
async function invokeWithRetry<T>(
  fn: (model: ReturnType<typeof getChatModel>) => Promise<T>,
  label: string
): Promise<T | null> {
  let totalAttempts = 0;
  const maxTotalAttempts = MAX_RETRIES * 3; // across all model fallbacks

  while (totalAttempts < maxTotalAttempts) {
    const model = getChatModel({ temperature: 0.3 });

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      totalAttempts++;
      try {
        return await fn(model);
      } catch (error) {
        const is429 =
          error instanceof Error &&
          (error.message.includes("429") ||
            error.message.includes("Too Many Requests") ||
            error.message.includes("quota"));

        if (!is429) {
          console.error(`[Summarizer] ${label} failed:`, error);
          return null;
        }

        console.warn(
          `[Summarizer] ${label} hit rate limit on ${getCurrentChatModelName()} ` +
          `(attempt ${attempt}/${MAX_RETRIES})`
        );

        // On last retry for this model, try switching models
        if (attempt === MAX_RETRIES) {
          const nextModel = switchToNextModel();
          if (nextModel) {
            console.warn(
              `[Summarizer] Switching to fallback: ${nextModel}`
            );
            // Small delay before trying new model
            await sleep(3000);
            break; // Break inner loop, continue outer while
          } else {
            console.warn(
              `[Summarizer] All models exhausted for ${label}`
            );
            return null;
          }
        }

        // Wait before retrying same model
        const waitMs = RETRY_DELAY_MS * attempt;
        console.warn(
          `[Summarizer] Waiting ${waitMs / 1000}s before retry...`
        );
        await sleep(waitMs);
      }
    }
  }

  return null;
}

async function directSummarize(text: string, outputParser: StringOutputParser, userId: string, documentId: string): Promise<string> {
  const langfuseHandler = new CallbackHandler({ tags: ["summarize", "direct"], userId, sessionId: documentId });
  const result = await invokeWithRetry(
    (model) => SUMMARY_PROMPT.pipe(model).pipe(outputParser).invoke({ content: text }, { callbacks: [langfuseHandler] }),
    "direct summary"
  );
  return result?.trim() ?? "Summary unavailable.";
}

async function mapReduceSummarize(chunks: TextChunk[], outputParser: StringOutputParser, userId: string, documentId: string): Promise<string> {
  const sampledChunks = sampleChunks(chunks, MAX_CHUNK_TOKENS_FOR_MAP);
  const mappedSummaries: string[] = [];

  for (const chunk of sampledChunks) {
    const langfuseMapHandler = new CallbackHandler({ tags: ["summarize", "map"], userId, sessionId: documentId });
    const summary = await invokeWithRetry(
      (model) =>
        MAP_PROMPT.pipe(model).pipe(outputParser).invoke({
          content: chunk.content,
        }, { callbacks: [langfuseMapHandler] }),
      `chunk ${chunk.chunkIndex}`
    );

    if (summary) {
      mappedSummaries.push(summary.trim());
    }

    // Delay between calls to stay under RPM limit
    await sleep(5000);
  }

  if (mappedSummaries.length === 0) {
    console.warn(
      "[Summarizer] All chunk summaries failed. Using fallback summary."
    );
    return chunks[0]?.content.slice(0, 500) ?? "Summary unavailable.";
  }

  // Reset model selection for reduce phase
  resetModelSelection();

  const langfuseReduceHandler = new CallbackHandler({ tags: ["summarize", "reduce"], userId, sessionId: documentId });
  const finalSummary = await invokeWithRetry(
    (model) =>
      REDUCE_PROMPT.pipe(model).pipe(outputParser).invoke({
        content: mappedSummaries.join("\n\n---\n\n"),
      }, { callbacks: [langfuseReduceHandler] }),
    "reduce phase"
  );

  return finalSummary?.trim() ?? mappedSummaries[0] ?? "Summary unavailable.";
}

function sampleChunks(
  chunks: TextChunk[],
  maxTokensPerChunk: number
): TextChunk[] {
  const MAX_CHUNKS = 5;

  if (chunks.length <= MAX_CHUNKS) {
    return chunks.filter((c) => c.tokenCount <= maxTokensPerChunk);
  }

  const result: TextChunk[] = [];

  const first = chunks[0];
  if (first && first.tokenCount <= maxTokensPerChunk) {
    result.push(first);
  }

  const step = Math.floor(chunks.length / (MAX_CHUNKS - 2));
  for (
    let i = step;
    i < chunks.length - 1 && result.length < MAX_CHUNKS - 1;
    i += step
  ) {
    const chunk = chunks[i];
    if (chunk && chunk.tokenCount <= maxTokensPerChunk) {
      result.push(chunk);
    }
  }

  const last = chunks[chunks.length - 1];
  if (
    last &&
    !result.includes(last) &&
    last.tokenCount <= maxTokensPerChunk
  ) {
    result.push(last);
  }

  return result;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}