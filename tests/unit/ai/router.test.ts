import { describe, expect, it } from "vitest";
import { HumanMessage } from "@langchain/core/messages";
import { AIRouter } from "@/lib/ai/router";
import { ProviderError } from "@/lib/ai/errors";
import type { ProviderHealthStore, HealthRecord } from "@/lib/ai/health-store";
import type { TextProvider, ProviderId } from "@/lib/ai/contracts";

class MemoryHealth implements ProviderHealthStore {
  records = new Map<ProviderId, HealthRecord>();
  async get(id: ProviderId) {
    return (
      this.records.get(id) ?? {
        state: "closed" as const,
        failures: 0,
        retryAt: 0,
      }
    );
  }
  async success(id: ProviderId) {
    this.records.set(id, { state: "closed", failures: 0, retryAt: 0 });
  }
  async failure(id: ProviderId) {
    const r = await this.get(id);
    this.records.set(id, {
      state: r.failures >= 2 ? "open" : "closed",
      failures: r.failures + 1,
      retryAt: Date.now() + 1000,
    });
  }
  async claimProbe() {
    return true;
  }
}
const provider = (
  id: ProviderId,
  behavior: () => string | Promise<string>
): TextProvider => ({
  id,
  model: `${id}-model`,
  kind: id === "openrouter" || id === "huggingface" ? "gateway" : "direct",
  configured: () => true,
  capabilities: {
    text: true,
    streaming: true,
    embeddings: id === "gemini",
    ocrPdf: id === "gemini",
  },
  async invoke() {
    return behavior();
  },
  async *stream() {
    yield await behavior();
  },
});
const request = {
  workload: "chat" as const,
  messages: [new HumanMessage("hello")],
};

describe("AIRouter", () => {
  it("selects the healthy preferred provider", async () => {
    process.env.AI_TEXT_PROVIDER_ORDER = "gemini,groq";
    process.env.AI_FALLBACK_ENABLED = "true";
    const result = await new AIRouter(
      [
        provider("gemini", () => "primary"),
        provider("groq", () => "secondary"),
      ],
      new MemoryHealth()
    ).invokeText(request);
    expect(result).toMatchObject({ text: "primary", provider: "gemini" });
  });

  it("enforces Gemini-only mode when AI_FALLBACK_ENABLED is false", async () => {
    process.env.AI_TEXT_PROVIDER_ORDER = "gemini,groq";
    process.env.AI_FALLBACK_ENABLED = "false";
    let groqCalled = false;
    const first = provider("gemini", () => {
      throw new ProviderError("busy", "server", true, 503);
    });
    const second = provider("groq", () => {
      groqCalled = true;
      return "secondary";
    });

    await expect(
      new AIRouter([first, second], new MemoryHealth()).invokeText(request)
    ).rejects.toMatchObject({ category: "server" });
    expect(groqCalled).toBe(false);
  });

  it("enforces Gemini-only mode when AI_TEXT_PROVIDER_ORDER is set to gemini", async () => {
    process.env.AI_TEXT_PROVIDER_ORDER = "gemini";
    process.env.AI_FALLBACK_ENABLED = "true";
    let groqCalled = false;
    const first = provider("gemini", () => {
      throw new ProviderError("busy", "server", true, 503);
    });
    const second = provider("groq", () => {
      groqCalled = true;
      return "secondary";
    });

    await expect(
      new AIRouter([first, second], new MemoryHealth()).invokeText(request)
    ).rejects.toMatchObject({ category: "server" });
    expect(groqCalled).toBe(false);
  });

  it("skips unconfigured secondary providers", async () => {
    process.env.AI_TEXT_PROVIDER_ORDER = "gemini,groq";
    process.env.AI_FALLBACK_ENABLED = "true";
    const first = provider("gemini", () => {
      throw new ProviderError("busy", "server", true, 503);
    });
    const second = provider("groq", () => "secondary");
    second.configured = () => false;

    await expect(
      new AIRouter([first, second], new MemoryHealth()).invokeText(request)
    ).rejects.toMatchObject({ category: "server" });
  });

  it("skips providers that do not support required capabilities (e.g. streaming)", async () => {
    process.env.AI_TEXT_PROVIDER_ORDER = "gemini,groq";
    process.env.AI_FALLBACK_ENABLED = "true";
    const first = provider("gemini", () => {
      throw new ProviderError("busy", "server", true, 503);
    });
    const second = provider("groq", () => "secondary");
    second.capabilities.streaming = false;

    await expect(
      new AIRouter([first, second], new MemoryHealth()).streamChat(
        { ...request, streaming: true },
        () => undefined
      )
    ).rejects.toMatchObject({ category: "server" });
  });

  it("skips providers whose circuit is open", async () => {
    process.env.AI_TEXT_PROVIDER_ORDER = "gemini,groq";
    process.env.AI_FALLBACK_ENABLED = "true";
    const health = new MemoryHealth();
    health.records.set("gemini", {
      state: "open",
      failures: 3,
      retryAt: Date.now() + 10000,
    });
    const first = provider("gemini", () => "primary");
    const second = provider("groq", () => "secondary");

    const result = await new AIRouter([first, second], health).invokeText(
      request
    );
    expect(result).toMatchObject({ text: "secondary", provider: "groq" });
  });

  it("allows a half-open probe if claimProbe succeeds, but skips if claimProbe fails", async () => {
    process.env.AI_TEXT_PROVIDER_ORDER = "gemini,groq";
    process.env.AI_FALLBACK_ENABLED = "true";
    const health = new MemoryHealth();
    health.records.set("gemini", {
      state: "half-open",
      failures: 3,
      retryAt: Date.now() - 100,
    });
    let probeAllowed = false;
    health.claimProbe = async () => probeAllowed;

    const first = provider("gemini", () => "primary");
    const second = provider("groq", () => "secondary");

    // When probe is NOT claimed, gemini is skipped -> falls back to groq
    probeAllowed = false;
    const res1 = await new AIRouter([first, second], health).invokeText(
      request
    );
    expect(res1.provider).toBe("groq");

    // When probe IS claimed, gemini is tried
    probeAllowed = true;
    const res2 = await new AIRouter([first, second], health).invokeText(
      request
    );
    expect(res2.provider).toBe("gemini");
  });

  it("falls back after a retryable pre-stream failure", async () => {
    process.env.AI_TEXT_PROVIDER_ORDER = "gemini,groq";
    process.env.AI_FALLBACK_ENABLED = "true";
    let calls = 0;
    const tokens: string[] = [];
    const first = provider("gemini", () => {
      calls++;
      throw new ProviderError("busy", "server", true, 503);
    });
    const result = await new AIRouter(
      [first, provider("groq", () => "ok")],
      new MemoryHealth()
    ).streamChat({ ...request, streaming: true }, (t) => tokens.push(t));
    expect(result.provider).toBe("groq");
    expect(result.text).toBe("ok");
    expect(tokens).toEqual(["ok"]);
    expect(calls).toBe(1);
  });

  it("does not fall back after visible content (post-token interruption)", async () => {
    process.env.AI_TEXT_PROVIDER_ORDER = "gemini,groq";
    process.env.AI_FALLBACK_ENABLED = "true";
    const tokens: string[] = [];
    let groqStreamCalled = false;
    const first = provider("gemini", () => "unused");
    first.stream = async function* () {
      yield "partial token";
      throw new ProviderError("connection reset", "network", true);
    };
    const second = provider("groq", () => "unused");
    second.stream = async function* () {
      groqStreamCalled = true;
      yield "should not be called";
    };

    await expect(
      new AIRouter([first, second], new MemoryHealth()).streamChat(
        { ...request, streaming: true },
        (t) => tokens.push(t)
      )
    ).rejects.toMatchObject({
      message:
        "The response was interrupted after streaming began. Please retry.",
      retryable: false,
    });
    expect(tokens).toEqual(["partial token"]);
    expect(groqStreamCalled).toBe(false);
  });

  it("does not fall back for authentication errors (401)", async () => {
    process.env.AI_TEXT_PROVIDER_ORDER = "gemini,groq";
    process.env.AI_FALLBACK_ENABLED = "true";
    let groqCalled = false;
    const first = provider("gemini", () => {
      throw new ProviderError("bad key", "authentication", false, 401);
    });
    const second = provider("groq", () => {
      groqCalled = true;
      return "wrong";
    });
    await expect(
      new AIRouter([first, second], new MemoryHealth()).invokeText(request)
    ).rejects.toMatchObject({ category: "authentication", retryable: false });
    expect(groqCalled).toBe(false);
  });

  it("does not fall back for authorization errors (403)", async () => {
    process.env.AI_TEXT_PROVIDER_ORDER = "gemini,groq";
    process.env.AI_FALLBACK_ENABLED = "true";
    let groqCalled = false;
    const first = provider("gemini", () => {
      throw new ProviderError("forbidden", "authorization", false, 403);
    });
    const second = provider("groq", () => {
      groqCalled = true;
      return "wrong";
    });
    await expect(
      new AIRouter([first, second], new MemoryHealth()).invokeText(request)
    ).rejects.toMatchObject({ category: "authorization", retryable: false });
    expect(groqCalled).toBe(false);
  });

  it("does not fall back for validation errors (400)", async () => {
    process.env.AI_TEXT_PROVIDER_ORDER = "gemini,groq";
    process.env.AI_FALLBACK_ENABLED = "true";
    let groqCalled = false;
    const first = provider("gemini", () => {
      throw new ProviderError("invalid payload", "validation", false, 400);
    });
    const second = provider("groq", () => {
      groqCalled = true;
      return "wrong";
    });
    await expect(
      new AIRouter([first, second], new MemoryHealth()).invokeText(request)
    ).rejects.toMatchObject({ category: "validation", retryable: false });
    expect(groqCalled).toBe(false);
  });

  it("does not fall back for safety errors", async () => {
    process.env.AI_TEXT_PROVIDER_ORDER = "gemini,groq";
    process.env.AI_FALLBACK_ENABLED = "true";
    let groqCalled = false;
    const first = provider("gemini", () => {
      throw new ProviderError("blocked by safety filters", "safety", false);
    });
    const second = provider("groq", () => {
      groqCalled = true;
      return "wrong";
    });
    await expect(
      new AIRouter([first, second], new MemoryHealth()).invokeText(request)
    ).rejects.toMatchObject({ category: "safety", retryable: false });
    expect(groqCalled).toBe(false);
  });

  it("respects total attempt bounds (max 2 per provider, max 2 providers)", async () => {
    process.env.AI_TEXT_PROVIDER_ORDER = "gemini,groq";
    process.env.AI_FALLBACK_ENABLED = "true";
    let geminiAttempts = 0;
    let groqAttempts = 0;
    const first = provider("gemini", () => {
      geminiAttempts++;
      throw new ProviderError("503 Server Error", "server", true, 503);
    });
    const second = provider("groq", () => {
      groqAttempts++;
      throw new ProviderError("503 Server Error", "server", true, 503);
    });

    await expect(
      new AIRouter([first, second], new MemoryHealth()).invokeText(request)
    ).rejects.toMatchObject({ category: "server", retryable: true });

    expect(geminiAttempts).toBe(2);
    expect(groqAttempts).toBe(2);
  });

  it("propagates client abort immediately", async () => {
    process.env.AI_TEXT_PROVIDER_ORDER = "gemini,groq";
    process.env.AI_FALLBACK_ENABLED = "true";
    const controller = new AbortController();
    controller.abort(new Error("Request aborted by user"));

    const first = provider("gemini", () => {
      throw new ProviderError("Aborted", "application", false);
    });

    await expect(
      new AIRouter([first], new MemoryHealth()).invokeText({
        ...request,
        signal: controller.signal,
      })
    ).rejects.toMatchObject({ category: "application", retryable: false });
  });
});
