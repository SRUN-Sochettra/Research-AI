import { describe, expect, it } from "vitest";
import { parseRoutingConfig } from "@/lib/ai/provider-config";
import { createProviderRegistry } from "@/lib/ai/provider-registry";

describe("provider configuration", () => {
  it("rejects unknown identifiers", () =>
    expect(() =>
      parseRoutingConfig({ AI_TEXT_PROVIDER_ORDER: "gemini,unknown" })
    ).toThrow("unknown provider"));
  it("normalizes duplicates", () =>
    expect(
      parseRoutingConfig({ AI_TEXT_PROVIDER_ORDER: "gemini,groq,gemini" }).order
    ).toEqual(["gemini", "groq"]));
  it.each(["0", "3", "many"])("rejects max providers %s", (value) =>
    expect(() =>
      parseRoutingConfig({
        AI_TEXT_PROVIDER_ORDER: "gemini",
        AI_MAX_PROVIDERS_PER_REQUEST: value,
      })
    ).toThrow("must be 1 or 2")
  );
  it("supports Gemini-only mode", () =>
    expect(
      parseRoutingConfig({
        AI_TEXT_PROVIDER_ORDER: "gemini",
        AI_FALLBACK_ENABLED: "false",
      })
    ).toMatchObject({ order: ["gemini"], maxProvidersPerRequest: 1 }));
  it("excludes optional providers without credentials", () =>
    expect(
      createProviderRegistry({})
        .filter((p) => p.id !== "gemini")
        .every((p) => !p.configured())
    ).toBe(true));
  it("requires explicit gateway models", () => {
    const providers = createProviderRegistry({
      OPENROUTER_API_KEY: "x",
      HUGGINGFACE_TOKEN: "x",
    });
    expect(providers.find((p) => p.id === "openrouter")?.configured()).toBe(
      false
    );
    expect(providers.find((p) => p.id === "huggingface")?.configured()).toBe(
      false
    );
  });
  it("requires complete Cloudflare configuration", () => {
    const p = createProviderRegistry({
      CLOUDFLARE_AI_API_TOKEN: "x",
      CLOUDFLARE_CHAT_MODEL: "@cf/model",
    }).find((candidate) => candidate.id === "cloudflare");
    expect(p?.configurationError?.()).toContain("CLOUDFLARE_ACCOUNT_ID");
  });
});
