import { getEmbeddingModel } from "@/lib/ai/gemini";
import { GEMINI_EMBEDDING_PROFILE } from "@/lib/ai/contracts";
import { sleep } from "@/lib/utils/helpers";
import type { TextChunk } from "./chunker";

export interface EmbeddedChunk extends TextChunk {
  embedding: number[];
}

const BATCH_SIZE = 10; // Gemini embedding batch size
const RETRY_DELAY_MS = 1000;
const MAX_RETRIES = 3;

export async function embedChunks(
  chunks: TextChunk[]
): Promise<EmbeddedChunk[]> {
  const embedder = getEmbeddingModel();
  const embeddedChunks: EmbeddedChunk[] = [];

  // Process in batches to respect rate limits
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map((chunk) => chunk.content);

    let embeddings: number[][] | null = null;
    let lastError: unknown;

    // Retry logic for transient failures
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        embeddings = await embedder.embedDocuments(texts);
        break; // Success
      } catch (error) {
        lastError = error;
        console.error(
          `Embedding batch ${Math.floor(i / BATCH_SIZE) + 1} attempt ${attempt} failed:`,
          error
        );

        if (attempt < MAX_RETRIES) {
          // Exponential backoff
          await sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }

    if (!embeddings) {
      throw new Error(
        `Failed to embed chunks after ${MAX_RETRIES} attempts: ${
          lastError instanceof Error ? lastError.message : "Unknown error"
        }`
      );
    }

    // Combine chunks with their embeddings
    for (let j = 0; j < batch.length; j++) {
      const chunk = batch[j];
      const embedding = embeddings[j];

      if (!chunk || !embedding) continue;

      embeddedChunks.push({
        ...chunk,
        embedding,
      });
    }

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < chunks.length) {
      await sleep(200);
    }
  }

  return embeddedChunks;
}

// Embed a single query (used during Q&A)
export async function embedQuery(
  query: string,
  profileId = GEMINI_EMBEDDING_PROFILE.id
): Promise<number[]> {
  if (profileId !== GEMINI_EMBEDDING_PROFILE.id) {
    throw new Error(`Incompatible embedding profile: ${profileId}`);
  }
  const embedder = getEmbeddingModel();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await embedder.embedQuery(query);
    } catch (error) {
      if (attempt === MAX_RETRIES) throw error;
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  throw new Error("Failed to embed query after max retries");
}
