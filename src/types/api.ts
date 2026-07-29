// src/types/api.ts
//
// API contract types + request-validation schemas.
//
// Reconstructed after this file was accidentally overwritten with a Markdown
// note. Shapes are derived from the actual route handlers that import them:
//   - ApiResponse / UploadResponse  → src/app/api/upload/route.ts
//   - chatSchema                    → src/app/api/chat/route.ts
//   - embedSchema / EmbedResponse   → src/app/api/embed/route.ts
// Error codes match src/lib/utils/errors.ts (toErrorResponse).

import { z } from "zod";
import { LIMITS } from "@/lib/utils/constants";
import type { DocumentStatus } from "@/types/database";

// ============================================
// Response envelope
// ============================================

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// Every route returns this envelope — never a bare object.
export type ApiResponse<T> =
  { success: true; data: T } | { success: false; error: ApiError };

// ============================================
// Request validation schemas
// ============================================

// POST /api/upload — file itself is validated from FormData in the route;
// this covers the optional metadata fields.
export const uploadSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

// POST /api/chat — single-doc (documentId) OR multi-doc (documentIds) chat.
// At least one target document is required.
export const chatSchema = z
  .object({
    message: z
      .string()
      .min(1, "Message cannot be empty")
      .max(LIMITS.maxMessageLength, "Message too long"),
    documentId: z.string().uuid().optional(),
    documentIds: z
      .array(z.string().uuid())
      .min(1, "Provide at least one document")
      .max(LIMITS.maxDocumentsPerUser, "Too many documents")
      .optional(),
    conversationId: z.string().uuid().optional(),
  })
  .refine((data) => Boolean(data.documentId) || Boolean(data.documentIds), {
    message: "Either documentId or documentIds must be provided",
    path: ["documentId"],
  });

// POST /api/summarize
export const summarizeSchema = z.object({
  documentId: z.string().uuid(),
});

// POST /api/embed
// Accepts EITHER a single `text` OR an array of `texts` (not both).
// Caps enforce cost/abuse limits (reuses the message length limit).
export const embedSchema = z.union([
  z.object({
    text: z
      .string()
      .min(1, "Text cannot be empty")
      .max(LIMITS.maxMessageLength, "Text too long"),
  }),
  z.object({
    texts: z
      .array(
        z
          .string()
          .min(1, "Text cannot be empty")
          .max(LIMITS.maxMessageLength, "Text too long")
      )
      .min(1, "Provide at least one text")
      .max(50, "Too many texts (max 50 per request)"),
  }),
]);

export type UploadInput = z.infer<typeof uploadSchema>;
export type ChatInput = z.infer<typeof chatSchema>;
export type SummarizeInput = z.infer<typeof summarizeSchema>;
export type EmbedInput = z.infer<typeof embedSchema>;

// ============================================
// Response types
// ============================================

export interface UploadResponse {
  documentId: string;
  status: DocumentStatus;
  message: string;
}

export interface ChatResponse {
  conversationId: string;
  messageId: string;
}

export interface SummarizeResponse {
  documentId: string;
  summary: string;
}

export interface EmbedResponse {
  model: string; // e.g. "gemini-embedding-001"
  dimension: number; // 3072
  embeddings: number[][]; // one vector per input text
}
