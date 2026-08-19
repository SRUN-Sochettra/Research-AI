import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logger } from "@/lib/observability/logger";

// Lazy initialization - only create when needed
let ratelimit: Ratelimit | null = null;
let hasWarnedUnconfigured = false;

export function _resetRateLimiterInstance(): void {
  ratelimit = null;
  hasWarnedUnconfigured = false;
}

export interface RedisCredentials {
  url: string;
  token: string;
}

/**
 * Resolves Redis REST credentials supporting both standard UPSTASH_* names
 * and Vercel's KV_REST_API_* integration fallback.
 * Excludes read-only tokens because rate limiting requires write operations.
 */
export function getRedisCredentials(): RedisCredentials | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return null;
  }

  return { url, token };
}

function getActionPrefix(identifier: string): string {
  const parts = identifier.split(":");
  return parts[0] || "unknown";
}

function getRatelimiter(): Ratelimit | null {
  const creds = getRedisCredentials();

  if (!creds) {
    if (!hasWarnedUnconfigured) {
      if (process.env.NODE_ENV === "production") {
        logger.error(
          "Rate limiter unconfigured in production environment. Upstash credentials are required."
        );
      } else {
        logger.warn(
          "Upstash not configured. Rate limiting disabled in non-production environment."
        );
      }
      hasWarnedUnconfigured = true;
    }
    return null;
  }

  if (!ratelimit) {
    const redis = new Redis({
      url: creds.url,
      token: creds.token,
    });

    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
      prefix: "synapsedoc:ratelimit",
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
  const isProd = process.env.NODE_ENV === "production";
  const action = getActionPrefix(identifier);
  const limiter = getRatelimiter();

  // If no limiter configured
  if (!limiter) {
    if (isProd) {
      // In production, missing rate limiting must fail closed to protect downstream AI resources
      return {
        success: false,
        limit: 0,
        remaining: 0,
        reset: Date.now() + 60000,
      };
    }

    // In development / testing, allow requests
    return {
      success: true,
      limit: 999,
      remaining: 999,
      reset: Date.now() + 60000,
    };
  }

  try {
    const result = await limiter.limit(identifier);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    if (isProd) {
      // In production, an Upstash outage must fail closed with a bounded limit response
      // to avoid unmetered Gemini consumption
      logger.error(
        "Rate limiter service error in production — failing closed to protect AI capacity",
        err,
        { action }
      );

      return {
        success: false,
        limit: 10,
        remaining: 0,
        reset: Date.now() + 60000,
      };
    }

    // In development / testing, log a warning and fail open
    logger.warn(
      "Upstash rate limiter unreachable in non-production — failing open",
      { action }
    );

    return {
      success: true,
      limit: 999,
      remaining: 999,
      reset: Date.now() + 60000,
    };
  }
}
