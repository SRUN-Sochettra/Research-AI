export interface AgentResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface ChunkMetadata {
  pageNumber: number;
  section?: string;
}
