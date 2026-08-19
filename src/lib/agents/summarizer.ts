import { SUMMARY_PROMPT, MAP_PROMPT, REDUCE_PROMPT } from "@/lib/ai/prompts";
import { aiRouter } from "@/lib/ai/router";
import type { TextChunk } from "./chunker";
const MAX_DIRECT_SUMMARY_TOKENS = 3000;
const MAX_CHUNK_TOKENS_FOR_MAP = 500;

async function summarizePrompt(prompt: typeof SUMMARY_PROMPT, content: string) {
  const messages = await prompt.formatMessages({ content });
  const result = await aiRouter.invokeText({
    workload: "summarization",
    messages,
    temperature: 0.2,
  });
  return result.text.trim();
}

export async function summarizeDocument(
  chunks: TextChunk[],
  _userId: string,
  _documentId: string
): Promise<string> {
  if (chunks.length === 0) return "Summary unavailable.";
  const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0);
  if (totalTokens <= MAX_DIRECT_SUMMARY_TOKENS) {
    return summarizePrompt(
      SUMMARY_PROMPT,
      chunks.map((chunk) => chunk.content).join("\n\n")
    );
  }

  const selected = sampleChunks(chunks, MAX_CHUNK_TOKENS_FOR_MAP);
  const mapped: string[] = [];
  for (const chunk of selected) {
    mapped.push(await summarizePrompt(MAP_PROMPT, chunk.content));
  }
  if (mapped.length === 0)
    return chunks[0]?.content.slice(0, 500) ?? "Summary unavailable.";
  return summarizePrompt(REDUCE_PROMPT, mapped.join("\n\n---\n\n"));
}

function sampleChunks(chunks: TextChunk[], maxTokens: number): TextChunk[] {
  const eligible = chunks.filter((chunk) => chunk.tokenCount <= maxTokens);
  if (eligible.length <= 5) return eligible;
  return [
    eligible[0],
    eligible[Math.floor(eligible.length / 4)],
    eligible[Math.floor(eligible.length / 2)],
    eligible[Math.floor((eligible.length * 3) / 4)],
    eligible[eligible.length - 1],
  ].filter((chunk): chunk is TextChunk => Boolean(chunk));
}
