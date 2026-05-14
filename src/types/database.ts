// ============================================
// Database types - matches our SQL schema exactly
// In production, generate with: npx supabase gen types typescript
// ============================================

export type UserTier = "free" | "pro";
export type DocumentStatus = "uploaded" | "processing" | "ready" | "error";
export type MessageRole = "user" | "assistant" | "system";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  tier: UserTier;
  usage_count: number;
  max_documents: number;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  title: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  page_count: number | null;
  status: DocumentStatus;
  summary: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  page_number: number | null;
  token_count: number | null;
  embedding: number[] | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  document_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Citation {
  chunk_id: string;
  page_number: number | null;
  snippet: string;
  similarity: number;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  citations: Citation[];
  token_usage: TokenUsage | null;
  latency_ms: number | null;
  created_at: string;
}

// ============================================
// Supabase client type helper
// ============================================
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at" | "usage_count" | "max_documents" | "tier">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      documents: {
        Row: Document;
        Insert: Omit<Document, "id" | "created_at" | "updated_at" | "status" | "summary" | "metadata"> & {
          id?: string;
          status?: DocumentStatus;
          summary?: string | null;
          metadata?: Record<string, unknown>;
        };
        Update: Partial<Omit<Document, "id" | "created_at" | "user_id">>;
      };
      document_chunks: {
        Row: DocumentChunk;
        Insert: Omit<DocumentChunk, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<DocumentChunk, "id" | "created_at">>;
      };
      conversations: {
        Row: Conversation;
        Insert: Omit<Conversation, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Omit<Conversation, "id" | "created_at" | "user_id">>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<Message, "id" | "created_at">>;
      };
    };
    Functions: {
      match_document_chunks: {
        Args: {
          query_embedding: number[];
          match_document_id: string;
          match_threshold?: number;
          match_count?: number;
        };
        Returns: {
          id: string;
          content: string;
          page_number: number | null;
          similarity: number;
        }[];
      };
    };
  };
}