# API Documentation

## Endpoints

### POST /api/upload
Uploads a PDF document and starts the processing pipeline.

### POST /api/chat
Handles RAG-based chat.
- **Body**: `{ message: string, documentId?: string }`

### POST /api/summarize
Generates a summary for a specific document.
- **Body**: `{ documentId: string }`

### GET /api/health
Checks the health of the application and its dependencies.
