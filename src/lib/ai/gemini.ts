import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { AI_CONFIG } from "@/lib/utils/constants";

// Validate API key exists
function getApiKey(): string {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) {
        throw new Error(
            "GOOGLE_API_KEY is not set. Check your .env.local file."
        );
    }
    return key;
}

// Chat model - used for Q&A and summarization
export function getChatModel(options?: {
    temperature?: number;
    streaming?: boolean;
}) {
    return new ChatGoogleGenerativeAI({
        model: AI_CONFIG.chatModel,
        apiKey: getApiKey(),
        temperature: options?.temperature ?? 0.3,
        streaming: options?.streaming ?? false,
        maxOutputTokens: 2048,
    });
}

// Embedding model - used for vectorizing chunks
export function getEmbeddingModel() {
    return new GoogleGenerativeAIEmbeddings({
        model: AI_CONFIG.embeddingModel,
        apiKey: getApiKey(),
    });
}