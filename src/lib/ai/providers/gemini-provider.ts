import { getChatModel } from "@/lib/ai/gemini";
import type { TextProvider } from "@/lib/ai/contracts";

function contentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content))
    return content
      .map((p) =>
        typeof p === "string"
          ? p
          : p && typeof p === "object" && "text" in p
            ? String(p.text)
            : ""
      )
      .join("");
  return "";
}

export function createGeminiProvider(): TextProvider {
  const model = process.env.GEMINI_CHAT_MODEL || "gemini-3.1-flash-lite";
  return {
    id: "gemini",
    model,
    kind: "direct",
    capabilities: {
      text: true,
      streaming: true,
      embeddings: true,
      ocrPdf: true,
    },
    configured: () => Boolean(process.env.GOOGLE_API_KEY),
    async invoke(request) {
      const response = await getChatModel({
        modelOverride: model,
        temperature: request.temperature,
        streaming: false,
      }).invoke(request.messages, { signal: request.signal });
      const text = contentToText(response.content).trim();
      if (!text)
        throw Object.assign(new Error("Gemini returned an empty response"), {
          status: 502,
        });
      return text;
    },
    async *stream(request) {
      const chunks = await getChatModel({
        modelOverride: model,
        temperature: request.temperature,
        streaming: true,
      }).stream(request.messages, { signal: request.signal });
      for await (const chunk of chunks) {
        const text = contentToText(chunk.content);
        if (text) yield text;
      }
    },
  };
}
