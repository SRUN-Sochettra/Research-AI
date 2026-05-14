export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface UploadResponse {
  documentId: string;
}

export interface ChatResponse {
  message: string;
  citations: any[];
}
