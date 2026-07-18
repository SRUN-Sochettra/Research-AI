import { z } from "zod";

// ============================================
// Request validation schemas
// ============================================

export const uploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.type === "application/pdf",
    "Only PDF files are accepted"
  ).refine(
    (file) => file.size <= 10 * 1024 * 1024,
    "File must be less than 10MB"
  ),
  title: z.string().min(1).max(200).optional(),
});

export const chatSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(5000, "Message too long"),
  documentId: z.string().uuid("Invalid document ID").optional(),
  documentIds: z.array(z.string().uuid("Invalid document ID")).optional(),
  conversationId: z.string().uuid("Invalid conversation ID").optional(),
});

export const summarizeSchema = z.object({
  documentId: z.string().uuid("Invalid document ID"),
});

// ============================================
// Response types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface UploadResponse {
  documentId: string;
  status: string;
  message: string;
}

export interface ChatResponse {
  messageId: string;
  content: string;
  citations: {
    chunk_id: string;
    page_number: number | null;
    snippet: string;
    similarity: number;
  }[];
  conversationId: string;
}

export interface StreamChunk {
  type: "text" | "citation" | "done" | "error";
  content: string;
  metadata?: Record<string, unknown>;
}