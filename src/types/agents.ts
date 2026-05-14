export interface AgentResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: any;
}

export interface ChunkMetadata {
  pageNumber: number;
  section?: string;
}
