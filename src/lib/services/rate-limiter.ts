import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Lazy initialization - only create when needed
let ratelimit: Ratelimit | null = null;

function getRatelimiter(): Ratelimit | null {
  // If Upstash not configured, skip rate limiting
  // (useful in development)
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    console.warn("⚠️  Upstash not configured. Rate limiting disabled.");
    return null;
  }

  if (!ratelimit) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
      prefix: "research-ai:ratelimit",
    });
  }

  return ratelimit;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}

export async function checkRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  const limiter = getRatelimiter();

  // If no limiter configured, allow all requests
  if (!limiter) {
    return {
      success: true,
      limit: 999,
      remaining: 999,
      reset: Date.now() + 60000,
    };
  }

  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}
