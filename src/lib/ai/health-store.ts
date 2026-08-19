import { Redis } from "@upstash/redis";
import { getRedisCredentials } from "@/lib/services/rate-limiter";
import { logger } from "@/lib/observability/logger";
import type { CircuitState, ProviderId } from "./contracts";

export interface HealthRecord {
  state: CircuitState;
  failures: number;
  retryAt: number;
}
export interface ProviderHealthStore {
  get(provider: ProviderId): Promise<HealthRecord>;
  success(provider: ProviderId): Promise<void>;
  failure(provider: ProviderId, retryAt?: number): Promise<void>;
  claimProbe(provider: ProviderId): Promise<boolean>;
}
const CLOSED: HealthRecord = { state: "closed", failures: 0, retryAt: 0 };
const local = new Map<ProviderId, HealthRecord>();

export class RedisProviderHealthStore implements ProviderHealthStore {
  private readonly redis: Redis | null;
  constructor(
    private threshold = 3,
    private cooldownMs = 45_000
  ) {
    const credentials = getRedisCredentials();
    this.redis = credentials ? new Redis(credentials) : null;
  }
  private key(provider: ProviderId) {
    return `synapsedoc:ai-health:${provider}`;
  }
  async get(provider: ProviderId): Promise<HealthRecord> {
    try {
      const record = this.redis
        ? await this.redis.get<HealthRecord>(this.key(provider))
        : null;
      const value = record ?? local.get(provider) ?? CLOSED;
      if (value.state === "open" && value.retryAt <= Date.now())
        return { ...value, state: "half-open" };
      return value;
    } catch (error) {
      logger.warn("AI health store read failed", {
        provider,
        error: error instanceof Error ? error.message : "unknown",
      });
      return local.get(provider) ?? CLOSED;
    }
  }
  async success(provider: ProviderId) {
    await this.write(provider, CLOSED);
  }
  async failure(provider: ProviderId, providerRetryAt?: number) {
    const current = await this.get(provider);
    const failures = current.failures + 1;
    const open = current.state === "half-open" || failures >= this.threshold;
    await this.write(provider, {
      state: open ? "open" : "closed",
      failures,
      retryAt: open
        ? Math.max(providerRetryAt ?? 0, Date.now() + this.cooldownMs)
        : 0,
    });
  }
  async claimProbe(provider: ProviderId): Promise<boolean> {
    if (!this.redis) return true;
    try {
      const result = await this.redis.set(`${this.key(provider)}:probe`, "1", {
        nx: true,
        ex: Math.ceil(this.cooldownMs / 1000),
      });
      return result === "OK";
    } catch (error) {
      logger.warn("AI health-store probe claim failed", {
        provider,
        error: error instanceof Error ? error.message : "unknown",
      });
      return true;
    }
  }
  private async write(provider: ProviderId, record: HealthRecord) {
    local.set(provider, record);
    if (!this.redis) return;
    try {
      await this.redis.set(this.key(provider), record, { ex: 300 });
    } catch (error) {
      logger.warn("AI health store write failed", {
        provider,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }
}
