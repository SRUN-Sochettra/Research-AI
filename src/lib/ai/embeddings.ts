import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
