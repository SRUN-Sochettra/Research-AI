import { describe, expect, it } from "vitest";
import { classifyProviderError, ProviderError } from "@/lib/ai/errors";
describe("provider error classification", () => {
  it.each([
    [429, "rate_limit", true],
    [503, "server", true],
    [401, "authentication", false],
    [403, "authorization", false],
    [400, "validation", false],
  ])("classifies HTTP %s", (status, category, retryable) => {
    const error = classifyProviderError(
      Object.assign(new Error("failure"), { status })
    );
    expect(error).toMatchObject({ category, retryable });
  });
  it("defaults unknown errors conservatively", () =>
    expect(classifyProviderError(new Error("mystery"))).toMatchObject({
      category: "unknown",
      retryable: false,
    }));
  it("preserves normalized errors", () => {
    const error = new ProviderError("x", "safety", false);
    expect(classifyProviderError(error)).toBe(error);
  });
});
