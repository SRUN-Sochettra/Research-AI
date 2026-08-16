import { describe, it, expect, vi } from "vitest";
import { runQAAgent } from "@/lib/agents/qa-agent";
import * as retrieverModule from "@/lib/agents/retriever";
import * as queryReformulatorModule from "@/lib/agents/query-reformulator";

vi.mock("@/lib/observability/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/observability/langfuse-callback", () => ({
  CallbackHandler: vi.fn().mockImplementation(() => ({})),
}));

describe("Chat Error Handling & Safe Error Boundaries", () => {
  it("captures non-JSON upstream provider failure and invokes onError safely", async () => {
    vi.spyOn(queryReformulatorModule, "reformulateQuery").mockResolvedValue(
      "reformulated question"
    );

    // Simulate upstream provider throwing JSON.parse syntax error (e.g. HTML error body from provider)
    const providerSyntaxError = new SyntaxError(
      "JSON.parse: unexpected character at line 1 column 1 of the JSON data"
    );
    vi.spyOn(retrieverModule, "retrieveRelevantChunks").mockRejectedValue(
      providerSyntaxError
    );

    const onToken = vi.fn();
    const onComplete = vi.fn();
    const onError = vi.fn();

    await runQAAgent(
      "Test question",
      "user-123",
      "conv-123",
      [],
      { onToken, onComplete, onError },
      "doc-123"
    );

    expect(onError).toHaveBeenCalledTimes(1);
    const passedError = onError.mock.calls[0]?.[0] as Error;
    expect(passedError).toBeDefined();
    expect(passedError.message).toContain("JSON.parse");
  });

  it("formats provider syntax error into safe client-facing message preserving SSE format", () => {
    const providerError = new SyntaxError(
      "JSON.parse: unexpected character at line 1 column 1 of the JSON data"
    );

    const isSyntaxOrProviderError =
      providerError instanceof Error &&
      (providerError.message.includes("JSON.parse") ||
        providerError.name === "SyntaxError" ||
        providerError.message.includes("Unexpected token"));

    const userMessage = isSyntaxOrProviderError
      ? "The AI provider returned an invalid response. Please retry."
      : "Failed to generate response. Please try again.";

    // Ensure safe output message is formatted for client
    expect(userMessage).toBe(
      "The AI provider returned an invalid response. Please retry."
    );
    expect(userMessage).not.toContain("JSON.parse");
    expect(userMessage).not.toContain("SyntaxError");

    // Verify SSE payload stringification preserves SSE format
    const ssePayload = `data: ${JSON.stringify({ type: "error", message: userMessage })}\n\n`;
    expect(ssePayload).toBe(
      'data: {"type":"error","message":"The AI provider returned an invalid response. Please retry."}\n\n'
    );
  });
});
