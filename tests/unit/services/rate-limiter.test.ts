import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  checkRateLimit,
  _resetRateLimiterInstance,
} from "@/lib/services/rate-limiter";

const mockLimit = vi.fn();

vi.mock("@upstash/ratelimit", () => {
  return {
    Ratelimit: Object.assign(
      function () {
        return {
          limit: mockLimit,
        };
      },
      {
        slidingWindow: vi.fn().mockReturnValue({}),
      }
    ),
  };
});

vi.mock("@upstash/redis", () => {
  return {
    Redis: function () {
      return {};
    },
  };
});

describe("Rate Limiter Service", () => {
  beforeEach(() => {
    _resetRateLimiterInstance();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    _resetRateLimiterInstance();
  });

  it("allows request when Upstash limit is not exceeded", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
    vi.stubEnv("NODE_ENV", "production");

    mockLimit.mockResolvedValueOnce({
      success: true,
      limit: 10,
      remaining: 9,
      reset: 1770000000000,
    });

    const result = await checkRateLimit("upload:user-123");
    expect(result.success).toBe(true);
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(9);
    expect(result.reset).toBe(1770000000000);
  });

  it("enforces limit response when Upstash limit is exceeded", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
    vi.stubEnv("NODE_ENV", "production");

    mockLimit.mockResolvedValueOnce({
      success: false,
      limit: 10,
      remaining: 0,
      reset: 1770000060000,
    });

    const result = await checkRateLimit("chat:user-123");
    expect(result.success).toBe(false);
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(0);
    expect(result.reset).toBe(1770000060000);
  });

  it("fails open in development/test when Upstash throws an exception", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
    vi.stubEnv("NODE_ENV", "development");

    mockLimit.mockRejectedValueOnce(new Error("Connection refused"));

    const result = await checkRateLimit("upload:user-dev");
    expect(result.success).toBe(true);
    expect(result.limit).toBe(999);
    expect(result.remaining).toBe(999);
  });

  it("fails closed in production when Upstash throws an exception", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
    vi.stubEnv("NODE_ENV", "production");

    mockLimit.mockRejectedValueOnce(
      new Error("Upstash 503 Service Unavailable")
    );

    const result = await checkRateLimit("upload:user-prod");
    expect(result.success).toBe(false);
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(0);
    expect(typeof result.reset).toBe("number");
  });

  it("fails open in development/test when Upstash configuration is missing", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.stubEnv("NODE_ENV", "development");

    const result = await checkRateLimit("chat:user-dev");
    expect(result.success).toBe(true);
    expect(result.limit).toBe(999);
    expect(result.remaining).toBe(999);
  });

  it("fails closed in production when Upstash configuration is missing", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.stubEnv("NODE_ENV", "production");

    const result = await checkRateLimit("chat:user-prod");
    expect(result.success).toBe(false);
    expect(result.limit).toBe(0);
    expect(result.remaining).toBe(0);
  });

  it("provides safe client-facing limit numbers without exposing Redis details", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "secret-token-12345");
    vi.stubEnv("NODE_ENV", "production");

    mockLimit.mockRejectedValueOnce(
      new Error(
        "Redis auth failed on https://secret-token-12345@example.upstash.io"
      )
    );

    const result = await checkRateLimit("summarize:user-secret");
    expect(result).toEqual({
      success: false,
      limit: 10,
      remaining: 0,
      reset: expect.any(Number),
    });
    // Ensure no error messages or secrets are leaked into the return object
    expect(JSON.stringify(result)).not.toContain("secret");
    expect(JSON.stringify(result)).not.toContain("Redis");
  });
});
