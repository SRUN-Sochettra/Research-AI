import { afterEach, describe, expect, it, vi } from "vitest";
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";
import { createOpenAICompatibleProvider } from "@/lib/ai/providers/openai-compatible-provider";
import { OPENAI_COMPATIBLE_CONFIGS } from "@/lib/ai/providers/provider-configs";
const envs: Record<string, Record<string, string | undefined>> = {
  groq: { GROQ_API_KEY: "secret", GROQ_CHAT_MODEL: "model" },
  cerebras: { CEREBRAS_API_KEY: "secret", CEREBRAS_CHAT_MODEL: "model" },
  sambanova: { SAMBANOVA_API_KEY: "secret", SAMBANOVA_CHAT_MODEL: "model" },
  mistral: { MISTRAL_API_KEY: "secret", MISTRAL_CHAT_MODEL: "model" },
  openrouter: { OPENROUTER_API_KEY: "secret", OPENROUTER_CHAT_MODEL: "model" },
  huggingface: {
    HUGGINGFACE_TOKEN: "secret",
    HUGGINGFACE_CHAT_MODEL: "model:provider",
  },
  cloudflare: {
    CLOUDFLARE_ACCOUNT_ID: "account",
    CLOUDFLARE_AI_API_TOKEN: "secret",
    CLOUDFLARE_CHAT_MODEL: "@cf/model",
  },
};
const input = {
  workload: "chat" as const,
  messages: [
    new SystemMessage("rules"),
    new HumanMessage("hello"),
    new AIMessage("history"),
  ],
};
afterEach(() => vi.unstubAllGlobals());
describe.each(OPENAI_COMPATIBLE_CONFIGS)("$id adapter", (config) => {
  it("uses official endpoint, bearer key, model and message roles", async () => {
    const mock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ choices: [{ message: { content: "ok" } }] }),
          { status: 200 }
        )
      );
    vi.stubGlobal("fetch", mock);
    const provider = createOpenAICompatibleProvider(config, envs[config.id]!);
    await expect(provider.invoke(input)).resolves.toBe("ok");
    const [url, init] = mock.mock.calls[0]!;
    expect(url).toBe(config.endpoint(envs[config.id]!));
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer secret"
    );
    expect(
      JSON.parse(String(init.body)).messages.map(
        (m: { role: string }) => m.role
      )
    ).toEqual(["system", "user", "assistant"]);
  });
  it.each([
    [429, "rate_limit", true],
    [503, "server", true],
    [400, "validation", false],
    [401, "authentication", false],
    [403, "authorization", false],
  ] as const)("classifies HTTP %s", async (status, category, retryable) => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("private", { status, headers: { "retry-after": "2" } })
        )
    );
    await expect(
      createOpenAICompatibleProvider(config, envs[config.id]!).invoke(input)
    ).rejects.toMatchObject({ category, retryable, status });
  });
  it("rejects empty output", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ choices: [] }), { status: 200 })
        )
    );
    await expect(
      createOpenAICompatibleProvider(config, envs[config.id]!).invoke(input)
    ).rejects.toMatchObject({ category: "invalid_response" });
  });
  it("parses streaming", async () => {
    const body = new ReadableStream({
      start(c) {
        c.enqueue(
          new TextEncoder().encode(
            'data: {"choices":[{"delta":{"content":"hi"}}]}\n\ndata: [DONE]\n\n'
          )
        );
        c.close();
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(body, { status: 200 }))
    );
    const tokens: string[] = [];
    for await (const token of createOpenAICompatibleProvider(
      config,
      envs[config.id]!
    ).stream(input))
      tokens.push(token);
    expect(tokens).toEqual(["hi"]);
  });
});
