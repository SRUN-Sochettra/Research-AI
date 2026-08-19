import { logger } from "@/lib/observability/logger";
import type { RetrievedChunk } from "@/lib/agents/retriever";

const COHERE_RERANK_ENDPOINT = "https://api.cohere.com/v2/rerank";
export const MAX_RERANK_CANDIDATES = 12;

export function rerankingEnabled(
  env: Record<string, string | undefined> = process.env
): boolean {
  return (
    env.AI_RERANK_ENABLED === "true" && env.AI_RERANK_PROVIDER === "cohere"
  );
}

export async function rerankChunks(
  query: string,
  chunks: RetrievedChunk[],
  finalCount: number,
  env: Record<string, string | undefined> = process.env,
  fetcher: typeof fetch = fetch
): Promise<RetrievedChunk[]> {
  const bounded = chunks.slice(0, MAX_RERANK_CANDIDATES);
  if (!rerankingEnabled(env)) {
    logger.info("AI reranking skipped", { reranking: "disabled" });
    return bounded.slice(0, finalCount);
  }
  if (!env.COHERE_API_KEY || !env.COHERE_RERANK_MODEL) {
    logger.warn("AI reranking failed open", {
      reranking: "invalid_configuration",
      provider: "cohere",
    });
    return bounded.slice(0, finalCount);
  }
  try {
    const response = await fetcher(COHERE_RERANK_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.COHERE_API_KEY}`,
        "Content-Type": "application/json",
        "X-Client-Name": "SynapseDoc",
      },
      body: JSON.stringify({
        model: env.COHERE_RERANK_MODEL,
        query,
        documents: bounded.map((chunk) => chunk.content),
        top_n: Math.min(finalCount, bounded.length),
      }),
    });
    if (!response.ok) throw new Error(`Cohere rerank HTTP ${response.status}`);
    const data = (await response.json()) as {
      results?: Array<{ index?: number; relevance_score?: number }>;
    };
    if (!data.results?.length)
      throw new Error("Cohere returned no rerank results");
    const seen = new Set<number>();
    const ordered = data.results.map((result) => {
      const index = result.index;
      if (
        !Number.isInteger(index) ||
        index! < 0 ||
        index! >= bounded.length ||
        seen.has(index!)
      ) {
        throw new Error("Cohere returned an invalid rerank index");
      }
      seen.add(index!);
      return bounded[index!]!;
    });
    logger.info("AI reranking completed", {
      reranking: "succeeded",
      provider: "cohere",
      candidateCount: bounded.length,
      resultCount: ordered.length,
    });
    return ordered.slice(0, finalCount);
  } catch (error) {
    logger.warn("AI reranking failed open", {
      reranking: "failed_open",
      provider: "cohere",
      candidateCount: bounded.length,
      error: error instanceof Error ? error.message : "unknown",
    });
    return bounded.slice(0, finalCount);
  }
}
