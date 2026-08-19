import type { BaseMessage } from "@langchain/core/messages";

export type AIWorkload = "chat" | "summarization" | "query-reformulation";
export const PROVIDER_IDS = [
  "gemini",
  "groq",
  "cerebras",
  "sambanova",
  "mistral",
  "openrouter",
  "huggingface",
  "cloudflare",
] as const;
export type ProviderId = (typeof PROVIDER_IDS)[number];
export type CircuitState = "closed" | "open" | "half-open";
export type ProviderKind = "direct" | "gateway";

export interface ProviderCapabilities {
  text: boolean;
  streaming: boolean;
  embeddings: boolean;
  ocrPdf: boolean;
  contextTokens?: number;
}

export interface TextRequest {
  workload: AIWorkload;
  messages: BaseMessage[];
  temperature?: number;
  streaming?: boolean;
  signal?: AbortSignal;
}

export interface TextProvider {
  id: ProviderId;
  model: string;
  kind: ProviderKind;
  capabilities: ProviderCapabilities;
  configured(): boolean;
  configurationError?(): string | null;
  invoke(request: TextRequest): Promise<string>;
  stream(request: TextRequest): AsyncIterable<string>;
}

export const GEMINI_EMBEDDING_PROFILE = {
  id: "google:gemini-embedding-001:3072:v1",
  provider: "gemini" as const,
  model: "gemini-embedding-001",
  dimensions: 3072,
};
