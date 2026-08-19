import { describe, it, expect, vi } from "vitest";
import { runQAAgent } from "@/lib/agents/qa-agent";
import * as retrieverModule from "@/lib/agents/retriever";
import * as queryReformulatorModule from "@/lib/agents/query-reformulator";
import { aiRouter } from "@/lib/ai/router";

vi.mock("@/lib/observability/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("Chat stream lifecycle, citations, and terminal SSE invariants", () => {
  it("delivers streamed tokens, citations from final answer, and exactly one completion callback", async () => {
    vi.spyOn(queryReformulatorModule, "reformulateQuery").mockResolvedValue(
      "what is attention mechanism"
    );

    const mockChunks: retrieverModule.RetrievedChunk[] = [
      {
        id: "chunk-1",
        content: "Attention is all you need is a neural network architecture.",
        documentId: "doc-1",
        pageNumber: 3,
        similarity: 0.88,
      },
      {
        id: "chunk-2",
        content: "Transformer uses self-attention mechanisms.",
        documentId: "doc-1",
        pageNumber: 4,
        similarity: 0.75,
      },
      {
        id: "chunk-3",
        content: "Irrelevant low similarity footnote.",
        documentId: "doc-1",
        pageNumber: 1,
        similarity: 0.45,
      },
    ];

    vi.spyOn(retrieverModule, "retrieveRelevantChunks").mockResolvedValue({
      chunks: mockChunks,
      query: "what is attention mechanism",
    });

    vi.spyOn(aiRouter, "streamChat").mockImplementation(
      async (_request, onToken) => {
        onToken("Attention ");
        onToken("is a key component ");
        onToken("of Transformers.");
        return {
          text: "Attention is a key component of Transformers.",
          provider: "groq",
          model: "llama-3.3-70b-versatile",
        };
      }
    );

    const receivedTokens: string[] = [];
    const onToken = vi.fn((t: string) => receivedTokens.push(t));
    const onComplete = vi.fn();
    const onError = vi.fn();

    await runQAAgent(
      "Explain attention",
      "user-1",
      "conv-1",
      [],
      { onToken, onComplete, onError },
      "doc-1"
    );

    expect(onError).not.toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(receivedTokens).toEqual([
      "Attention ",
      "is a key component ",
      "of Transformers.",
    ]);

    const result = onComplete.mock.calls[0]?.[0];
    expect(result.answer).toBe("Attention is a key component of Transformers.");
    // Filtered by similarity > 0.6
    expect(result.citations).toHaveLength(2);
    expect(result.citations[0]).toMatchObject({
      chunk_id: "chunk-1",
      documentId: "doc-1",
      pageNumber: 3,
      similarity: 0.88,
    });
    expect(result.citations[1]).toMatchObject({
      chunk_id: "chunk-2",
      documentId: "doc-1",
      pageNumber: 4,
      similarity: 0.75,
    });
  });
});
