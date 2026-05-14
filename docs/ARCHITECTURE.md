# System Architecture

## Overview
AI Research Assistant is a RAG-based application that allows users to upload PDF documents and interact with them using natural language.

## Tech Stack
- **Frontend**: Next.js 14+ (App Router), Tailwind CSS, shadcn/ui
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI/LLM**: Google Gemini (1.5 Flash/Pro), LangChain
- **Auth**: Supabase Auth
- **Rate Limiting**: Upstash Redis
- **Observability**: Langfuse

## Data Flow
1. User uploads PDF -> API Route
2. PDF Parser extracts text -> Chunker splits text
3. Embedder generates vectors -> Stored in Supabase
4. User asks question -> Retriever finds relevant chunks
5. QA Agent generates response -> Streamed back to user
