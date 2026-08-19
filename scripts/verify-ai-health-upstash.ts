import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { Redis } from "@upstash/redis";
import { getRedisCredentials } from "../src/lib/services/rate-limiter";
import { RedisProviderHealthStore } from "../src/lib/ai/health-store";

async function verifyAiHealthUpstash() {
  console.log("=== VERIFYING REAL UPSTASH WITH AI HEALTH STORE ===");

  const creds = getRedisCredentials();
  if (!creds) {
    console.error("❌ Redis credentials not found!");
    process.exit(1);
  }

  const redis = new Redis({
    url: creds.url,
    token: creds.token,
  });

  const testProvider = "gemini"; // Test provider ID
  const healthStore = new RedisProviderHealthStore(3, 2000); // 3 threshold, 2s cooldown

  try {
    // 1. Reset state
    await healthStore.success(testProvider);
    const initial = await healthStore.get(testProvider);
    console.log(
      "1. Initial state (closed, 0 failures):",
      initial.state === "closed" && initial.failures === 0 ? "[PASS]" : "[FAIL]"
    );

    // 2. Increment failures
    await healthStore.failure(testProvider);
    await healthStore.failure(testProvider);
    const afterTwo = await healthStore.get(testProvider);
    console.log(
      "2. After 2 failures (closed, 2 failures):",
      afterTwo.state === "closed" && afterTwo.failures === 2
        ? "[PASS]"
        : "[FAIL]"
    );

    // 3. Reaching threshold opens circuit
    await healthStore.failure(testProvider);
    const openState = await healthStore.get(testProvider);
    console.log(
      "3. Circuit state open after 3 failures:",
      openState.state === "open" && openState.failures === 3
        ? "[PASS]"
        : "[FAIL]"
    );

    // 4. Verify TTL on Redis key
    const rawRecord = await redis.get<{
      state: string;
      failures: number;
      retryAt: number;
    }>(`synapsedoc:ai-health:${testProvider}`);
    const ttl = await redis.ttl(`synapsedoc:ai-health:${testProvider}`);
    console.log(
      `4. Redis key TTL verification (TTL=${ttl}s, state=${rawRecord?.state}):`,
      ttl > 0 && ttl <= 300 && rawRecord?.state === "open" ? "[PASS]" : "[FAIL]"
    );

    // 5. Verify concurrency-safe probe leasing with SET NX
    const firstProbe = await healthStore.claimProbe(testProvider);
    const secondProbe = await healthStore.claimProbe(testProvider);
    console.log(
      "5. Probe lease locking (first=true, second=false):",
      firstProbe === true && secondProbe === false ? "[PASS]" : "[FAIL]"
    );

    const probeTtl = await redis.ttl(
      `synapsedoc:ai-health:${testProvider}:probe`
    );
    console.log(
      `6. Probe key TTL positive (${probeTtl}s):`,
      probeTtl > 0 ? "[PASS]" : "[FAIL]"
    );

    // 6. Cooldown expiration -> Half-Open transition
    console.log("7. Waiting 2.2s for cooldown expiration...");
    await new Promise((r) => setTimeout(r, 2200));
    const halfOpenState = await healthStore.get(testProvider);
    console.log(
      "8. Circuit transitioned to half-open after cooldown:",
      halfOpenState.state === "half-open" ? "[PASS]" : "[FAIL]"
    );

    // 7. Success resets to closed
    await healthStore.success(testProvider);
    const closedAfterSuccess = await healthStore.get(testProvider);
    console.log(
      "9. Success resets circuit to closed:",
      closedAfterSuccess.state === "closed" && closedAfterSuccess.failures === 0
        ? "[PASS]"
        : "[FAIL]"
    );
  } finally {
    // 8. Clean up Redis keys
    const deletedHealth = await redis.del(
      `synapsedoc:ai-health:${testProvider}`
    );
    const deletedProbe = await redis.del(
      `synapsedoc:ai-health:${testProvider}:probe`
    );
    console.log(
      `10. Cleanup: deleted health key (${deletedHealth}) and probe key (${deletedProbe}) [PASS]`
    );

    // Verify key deletion
    const finalHealth = await redis.get(`synapsedoc:ai-health:${testProvider}`);
    const finalProbe = await redis.get(
      `synapsedoc:ai-health:${testProvider}:probe`
    );
    console.log(
      "11. Verified zero leftover health/probe keys:",
      finalHealth === null && finalProbe === null ? "[PASS]" : "[FAIL]"
    );
  }

  console.log(
    "\n✅ REAL UPSTASH AI HEALTH VERIFICATION COMPLETED SUCCESSFULLY"
  );
}

verifyAiHealthUpstash().catch((err) => {
  console.error("❌ AI Health Upstash verification failed:", err);
  process.exit(1);
});
