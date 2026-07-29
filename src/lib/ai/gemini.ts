// src/lib/ai/gemini.ts
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { AI_CONFIG } from "@/lib/utils/constants";

function getApiKey(): string {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) {
    throw new Error("GOOGLE_API_KEY is not set. Check your .env.local file.");
  }
  return key;
}

// Chat model - used for Q&A and summarization.
// `modelOverride` lets callers drive the fallback chain via a ChatModelSelector
// (see below) instead of shared module state.
export function getChatModel(options?: {
  temperature?: number;
  streaming?: boolean;
  modelOverride?: string;
}) {
  const model = options?.modelOverride ?? AI_CONFIG.chatModel;

  return new ChatGoogleGenerativeAI({
    model,
    apiKey: getApiKey(),
    temperature: options?.temperature ?? 0.3,
    streaming: options?.streaming ?? false,
    maxOutputTokens: 2048,
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Per-invocation fallback selector.
//
// WHY THIS EXISTS (fixes the previous module-global `currentChatModelIndex`):
// The old switchToNextModel()/resetModelSelection() mutated a single shared
// module variable. On a warm serverless instance, two concurrent pipeline runs
// raced on that index — one run's fallback/reset corrupted the other's model
// choice. Each pipeline run should now create its own selector so state is
// isolated to that run.
//
// Usage:
//   const selector = createChatModelSelector();
//   const model = getChatModel({ modelOverride: selector.current(), streaming });
//   // on 429:
//   const next = selector.next();      // null once the chain is exhausted
//   // at the start of a fresh phase:
//   selector.reset();
// ─────────────────────────────────────────────────────────────────────────
export class ChatModelSelector {
  private index = 0;

  /** The model name to use right now. */
  current(): string {
    return AI_CONFIG.chatModelFallbacks[this.index] ?? AI_CONFIG.chatModel;
  }

  /**
   * Advance to the next fallback model. Returns the new model name, or `null`
   * once every model in the chain has been tried (and resets to the primary).
   */
  next(): string | null {
    this.index++;

    if (this.index >= AI_CONFIG.chatModelFallbacks.length) {
      this.index = 0;
      return null; // exhausted all fallbacks
    }

    const nextModel = AI_CONFIG.chatModelFallbacks[this.index];
    console.warn(`[Gemini] Switching to fallback model: ${nextModel}`);
    return nextModel ?? null;
  }

  /** Reset to the primary model (call at the start of each phase/run). */
  reset(): void {
    this.index = 0;
  }
}

export function createChatModelSelector(): ChatModelSelector {
  return new ChatModelSelector();
}

// Embedding model - used for vectorizing chunks
export function getEmbeddingModel() {
  return new GoogleGenerativeAIEmbeddings({
    model: AI_CONFIG.embeddingModel,
    apiKey: getApiKey(),
  });
}
