# AI Research Assistant 🤖📚

A powerful, production-ready RAG (Retrieval-Augmented Generation) application built with Next.js, Google Gemini, and Supabase.

## ✨ Features
- **PDF Research**: Upload complex academic papers or technical docs and get instant insights.
- **Semantic Search**: Powered by `pgvector` for highly accurate context retrieval.
- **Multi-Agent Architecture**: Modular agents for parsing, chunking, embedding, and reasoning.
- **Real-time Chat**: Streaming responses for a smooth user experience.
- **Observability**: Full LLM call tracing with Langfuse.
- **Enterprise Ready**: Rate limiting with Upstash and robust auth with Supabase.

## 🛠️ Tech Stack
- **Framework**: [Next.js 14 (App Router)](https://nextjs.org/)
- **AI Model**: [Google Gemini 1.5](https://deepmind.google/technologies/gemini/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL + pgvector)
- **Vector Search**: [pgvector](https://github.com/pgvector/pgvector)
- **Tracing**: [Langfuse](https://langfuse.com/)
- **Rate Limiting**: [Upstash](https://upstash.com/)
- **Styling**: Tailwind CSS + shadcn/ui

## 🚀 Quick Start

### 1. Clone the repo
```bash
git clone https://github.com/your-username/ai-research-assistant.git
cd ai-research-assistant
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy `.env.example` to `.env.local` and fill in your keys.

### 4. Setup Database
Initialize your Supabase project and run the schema in `src/lib/db/schema.sql`.

### 5. Run development server
```bash
npm run dev
```

## 🧪 Testing
- **Unit Tests**: `npm run test`
- **E2E Tests**: `npm run test:e2e`

## 📖 Documentation
- [Architecture](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## 📄 License
MIT
