import { getChatModel } from "@/lib/ai/gemini";
import { MAP_PROMPT, REDUCE_PROMPT, SUMMARY_PROMPT } from "@/lib/ai/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import type { TextChunk } from "./chunker";

const MAX_DIRECT_SUMMARY_TOKENS = 3000;
const MAX_CHUNK_TOKENS_FOR_MAP = 500;

export async function summarizeDocument(
  chunks: TextChunk[]
): Promise<string> {
  const model = getChatModel({ temperature: 0.3 });
  const outputParser = new StringOutputParser();

  // Calculate total token count
  const totalTokens = chunks.reduce(
    (sum, chunk) => sum + chunk.tokenCount,
    0
  );

  // For short documents: direct summarization
  if (totalTokens <= MAX_DIRECT_SUMMARY_TOKENS) {
    return await directSummarize(
      chunks.map((c) => c.content).join("\n\n"),
      model,
      outputParser
    );
  }

  // For longer documents: map-reduce summarization
  return await mapReduceSummarize(chunks, model, outputParser);
}

async function directSummarize(
  text: string,
  model: ReturnType<typeof getChatModel>,
  outputParser: StringOutputParser
): Promise<string> {
  const chain = SUMMARY_PROMPT.pipe(model).pipe(outputParser);

  const summary = await chain.invoke({ content: text });
  return summary.trim();
}

async function mapReduceSummarize(
  chunks: TextChunk[],
  model: ReturnType<typeof getChatModel>,
  outputParser: StringOutputParser
): Promise<string> {
  // MAP phase: summarize each chunk independently
  const mapChain = MAP_PROMPT.pipe(model).pipe(outputParser);

  // Select representative chunks (every Nth chunk to stay in limits)
  const sampledChunks = sampleChunks(
    chunks,
    MAX_CHUNK_TOKENS_FOR_MAP
  );

  const mappedSummaries: string[] = [];

  for (const chunk of sampledChunks) {
    try {
      const summary = await mapChain.invoke({
        content: chunk.content,
      });
      mappedSummaries.push(summary.trim());
    } catch (error) {
      console.error(
        `Failed to map chunk ${chunk.chunkIndex}:`,
        error
      );
      // Continue with other chunks
    }
  }

  if (mappedSummaries.length === 0) {
    throw new Error("Failed to generate any chunk summaries");
  }

  // REDUCE phase: combine all summaries into one
  const reduceChain = REDUCE_PROMPT.pipe(model).pipe(outputParser);

  const finalSummary = await reduceChain.invoke({
    content: mappedSummaries.join("\n\n---\n\n"),
  });

  return finalSummary.trim();
}

// Sample chunks to stay within token limits during map phase
function sampleChunks(
  chunks: TextChunk[],
  maxTokensPerChunk: number
): TextChunk[] {
  // Take first chunk (intro), last chunk (conclusion),
  // and evenly distributed chunks in between
  if (chunks.length <= 10) return chunks;

  const result: TextChunk[] = [];
  const step = Math.floor(chunks.length / 8);

  for (let i = 0; i < chunks.length; i += step) {
    const chunk = chunks[i];
    if (chunk && chunk.tokenCount <= maxTokensPerChunk) {
      result.push(chunk);
    }
  }

  // Always include last chunk
  const lastChunk = chunks[chunks.length - 1];
  if (lastChunk && !result.includes(lastChunk)) {
    result.push(lastChunk);
  }

  return result;
}