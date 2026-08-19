import { describe, expect, it, vi, beforeEach } from "vitest";
import { RedisProviderHealthStore } from "@/lib/ai/health-store";

describe("RedisProviderHealthStore", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    const resetStore = new RedisProviderHealthStore(3, 45_000);
    await resetStore.success("gemini");
    await resetStore.success("groq");
  });

  it("returns closed state by default", async () => {
    const store = new RedisProviderHealthStore(3, 45_000);
    const health = await store.get("gemini");
    expect(health).toEqual({ state: "closed", failures: 0, retryAt: 0 });
  });

  it("increments failures and transitions to open after threshold", async () => {
    const store = new RedisProviderHealthStore(3, 45_000);

    await store.failure("gemini");
    expect(await store.get("gemini")).toMatchObject({
      state: "closed",
      failures: 1,
    });

    await store.failure("gemini");
    expect(await store.get("gemini")).toMatchObject({
      state: "closed",
      failures: 2,
    });

    await store.failure("gemini");
    const openHealth = await store.get("gemini");
    expect(openHealth.state).toBe("open");
    expect(openHealth.failures).toBe(3);
    expect(openHealth.retryAt).toBeGreaterThan(Date.now());
  });

  it("transitions from open to half-open after cooldown expires", async () => {
    const store = new RedisProviderHealthStore(3, 100);

    await store.failure("gemini");
    await store.failure("gemini");
    await store.failure("gemini");

    expect((await store.get("gemini")).state).toBe("open");

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect((await store.get("gemini")).state).toBe("half-open");
  });

  it("resets to closed on success", async () => {
    const store = new RedisProviderHealthStore(3, 45_000);
    await store.failure("gemini");
    await store.failure("gemini");
    expect((await store.get("gemini")).failures).toBe(2);

    await store.success("gemini");
    expect(await store.get("gemini")).toEqual({
      state: "closed",
      failures: 0,
      retryAt: 0,
    });
  });

  it("falls back to local memory if Redis operations throw or are unconfigured", async () => {
    const store = new RedisProviderHealthStore(3, 45_000);
    await store.failure("groq");
    expect(await store.get("groq")).toMatchObject({
      state: "closed",
      failures: 1,
    });
    expect(await store.claimProbe("groq")).toBe(true);
  });
});
