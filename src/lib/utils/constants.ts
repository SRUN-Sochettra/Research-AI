export const APP_CONFIG = {
  name: "Mogger Research",
  description:
    "Source-grounded PDF research with summaries, answers, and page-level citations",
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
  embeddingModel: "gemini-embedding-001",
  chatModel: "gemini-3.1-flash-lite",
  // Multimodal model used only for the OCR fallback path in pdf-parser.ts
  // (when a PDF has no extractable text layer). Kept in constants so it
  // isn't hardcoded to a model line that gets retired.
  ocrModel: "gemini-2.5-flash",
  chatModelFallbacks: [
    "gemini-3.1-flash-lite", // 15 RPM, 500 RPD
    "gemini-2.5-flash", // 5 RPM, 20 RPD
    "gemini-2.5-flash-lite", // 10 RPM, 20 RPD
    "gemini-2.0-flash-lite", // backup
    "gemini-2.0-flash", // backup
  ],
  embeddingDimension: 3072,
  chunkSize: 1000,
  chunkOverlap: 200,
  maxRetrievedChunks: 5,
  similarityThreshold: 0.7,
  maxConversationHistory: 10,
} as const;

export const SUPPORTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
} as const;
