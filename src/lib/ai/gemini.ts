// src/lib/ai/gemini.ts
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { AI_CONFIG } from "@/lib/utils/constants";

// Track which model is currently working to avoid retrying dead ones
let currentChatModelIndex = 0;

function getApiKey(): string {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) {
        throw new Error(
            "GOOGLE_API_KEY is not set. Check your .env.local file."
        );
    }
    return key;
}

// Get the current best chat model name
export function getCurrentChatModelName(): string {
    return AI_CONFIG.chatModelFallbacks[currentChatModelIndex]
        ?? AI_CONFIG.chatModel;
}

// Chat model - used for Q&A and summarization
export function getChatModel(options?: {
    temperature?: number;
    streaming?: boolean;
    modelOverride?: string;
}) {
    const model = options?.modelOverride ?? getCurrentChatModelName();

    return new ChatGoogleGenerativeAI({
        model,
        apiKey: getApiKey(),
        temperature: options?.temperature ?? 0.3,
        streaming: options?.streaming ?? false,
        maxOutputTokens: 2048,
    });
}

// Try the next fallback model when current one hits rate limits
export function switchToNextModel(): string | null {
    currentChatModelIndex++;

    if (currentChatModelIndex >= AI_CONFIG.chatModelFallbacks.length) {
        // Reset to first model (it may have recovered by now)
        currentChatModelIndex = 0;
        return null; // Signal that we've exhausted all fallbacks
    }

    const nextModel = AI_CONFIG.chatModelFallbacks[currentChatModelIndex];
    console.warn(
        `[Gemini] Switching to fallback model: ${nextModel}`
    );
    return nextModel ?? null;
}

// Reset to primary model (call this at the start of each pipeline run)
export function resetModelSelection(): void {
    currentChatModelIndex = 0;
}

// Embedding model - used for vectorizing chunks
export function getEmbeddingModel() {
    return new GoogleGenerativeAIEmbeddings({
        model: AI_CONFIG.embeddingModel,
        apiKey: getApiKey(),
    });
}