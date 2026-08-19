import { describe, expect, it, vi } from "vitest";
import { rerankChunks } from "@/lib/ai/reranker";
import type { RetrievedChunk } from "@/lib/agents/retriever";
const chunks: RetrievedChunk[] = [
  { id: "a", documentId: "doc", content: "A", pageNumber: 1, similarity: 0.9 },
  { id: "b", documentId: "doc", content: "B", pageNumber: 2, similarity: 0.8 },
  { id: "c", documentId: "doc", content: "C", pageNumber: 3, similarity: 0.7 },
];
const env = {
  AI_RERANK_ENABLED: "true",
  AI_RERANK_PROVIDER: "cohere",
  COHERE_API_KEY: "secret",
  COHERE_RERANK_MODEL: "model",
};
describe("Cohere reranking", () => {
  it("disabled preserves vector order", async () =>
    expect(await rerankChunks("q", chunks, 2, {})).toEqual(chunks.slice(0, 2)));
  it("reorders without detaching citation metadata", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ results: [{ index: 2 }, { index: 0 }] }),
          { status: 200 }
        )
      );
    const result = await rerankChunks("q", chunks, 2, env, fetcher);
    expect(result).toEqual([chunks[2], chunks[0]]);
  });
  it.each([
    new Response("failure", { status: 500 }),
    new Response(JSON.stringify({ results: [] }), { status: 200 }),
    new Response(JSON.stringify({ results: [{ index: 99 }] }), { status: 200 }),
  ])("fails open", async (response) =>
    expect(
      await rerankChunks(
        "q",
        chunks,
        2,
        env,
        vi.fn().mockResolvedValue(response)
      )
    ).toEqual(chunks.slice(0, 2))
  );
});
