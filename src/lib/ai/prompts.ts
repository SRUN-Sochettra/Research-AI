import { PromptTemplate, ChatPromptTemplate } from "@langchain/core/prompts";

// ============================================
// SUMMARIZATION PROMPT
// ============================================
export const SUMMARY_PROMPT = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an expert research assistant. Your job is to create 
comprehensive, well-structured summaries of documents.

Guidelines:
- Start with a 1-2 sentence overview of what the document is about
- Highlight the key findings, arguments, or information
- Use clear, concise language
- Preserve important technical terms and proper nouns
- Keep the summary between 150-300 words
- Do NOT use markdown headers or bullet points in the summary
- Write in flowing prose`,
  ],
  [
    "human",
    `Please summarize the following document content:

{content}

Summary:`,
  ],
]);

// ============================================
// MAP PROMPT (for map-reduce summarization)
// ============================================
export const MAP_PROMPT = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an expert at extracting key information from text chunks.
Extract the most important information from this section concisely.`,
  ],
  [
    "human",
    `Extract key information from this text chunk:

{content}

Key information:`,
  ],
]);

// ============================================
// REDUCE PROMPT (for map-reduce summarization)
// ============================================
export const REDUCE_PROMPT = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an expert research assistant. Combine the following 
extracted information from different sections of a document into a 
single, coherent summary of 150-300 words. Write in flowing prose.`,
  ],
  [
    "human",
    `Combine these extracted sections into one coherent summary:

{content}

Final summary:`,
  ],
]);

// ============================================
// Q&A PROMPT (RAG)
// ============================================
export const QA_PROMPT = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an expert research assistant with access to specific 
document content. Answer questions accurately based ONLY on the 
provided context.

Rules:
1. Only use information from the provided context
2. If the answer is not in the context, say: 
   "I couldn't find information about that in this document."
3. Always be specific and cite which part of the document 
   your answer comes from
4. Keep answers clear and well-structured
5. If relevant, mention the page number

Context from the document:
{context}

Conversation history:
{chat_history}`,
  ],
  ["human", "{question}"],
]);

// ============================================
// QUERY REFORMULATION PROMPT
// ============================================
export const QUERY_REFORMULATION_PROMPT = PromptTemplate.fromTemplate(
  `Given a conversation history and a follow-up question, 
reformulate the question to be standalone and optimized for 
semantic search against a document.

Conversation history:
{chat_history}

Follow-up question: {question}

Standalone search query (output ONLY the query, nothing else):`,
);