import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/ai/gemini", () => ({
  getEmbeddingModel: () => ({
    embedQuery: vi.fn(async () => new Array(3072).fill(0)),
  }),
}));
import { embedQuery } from "@/lib/agents/embedder";
import { GEMINI_EMBEDDING_PROFILE } from "@/lib/ai/contracts";
describe("embedding profile affinity", () => {
  it("keeps the existing Gemini 3072 profile", async () =>
    expect(await embedQuery("q", GEMINI_EMBEDDING_PROFILE.id)).toHaveLength(
      3072
    ));
  it("rejects a different provider even if dimensions match", async () =>
    await expect(embedQuery("q", "other:model:3072:v1")).rejects.toThrow(
      "Incompatible embedding profile"
    ));
});
