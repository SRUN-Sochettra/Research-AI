export const APP_CONFIG = {
    name: "Research AI",
    description: "AI-powered research assistant that reads PDFs, summarizes, and answers questions",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
} as const;

export const LIMITS = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxDocumentsPerUser: 10,
    maxMessageLength: 5000,
    maxConversationsPerDocument: 5,
    rateLimit: {
        maxRequests: 10,
        windowMs: 60 * 1000, // 1 minute
    },
} as const;

export const AI_CONFIG = {
    embeddingModel: "text-embedding-004",
    chatModel: "gemini-1.5-flash",
    embeddingDimension: 768,
    chunkSize: 1000,
    chunkOverlap: 200,
    maxRetrievedChunks: 5,
    similarityThreshold: 0.7,
    maxConversationHistory: 10,
} as const;

export const SUPPORTED_FILE_TYPES = {
    "application/pdf": [".pdf"],
} as const;