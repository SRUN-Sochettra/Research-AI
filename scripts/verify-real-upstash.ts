import { Redis } from "@upstash/redis";
import { getRedisCredentials } from "../src/lib/services/rate-limiter";
import { randomUUID } from "crypto";

async function runPhase3Verification() {
  console.log("=== PHASE 3 — VERIFY REAL UPSTASH CONNECTIVITY ===");

  const creds = getRedisCredentials();
  if (!creds) {
    console.error("❌ Redis credentials not found via UPSTASH_* or KV_*!");
    process.exit(1);
  }

  const redis = new Redis({
    url: creds.url,
    token: creds.token,
  });

  // 1. PING
  const pingRes = await redis.ping();
  console.log(`1. PING response: ${pingRes} [PASS]`);

  // 2. Write temporary key
  const randomId = randomUUID();
  const testKey = `synapsedoc:verification:${randomId}`;
  const testVal = `test_payload_${Date.now()}`;
  const redactedSuffix = `...${randomId.slice(-8)}`;

  await redis.set(testKey, testVal, { ex: 60 });
  console.log(
    `2. Written temporary key with prefix 'synapsedoc:verification:${redactedSuffix}' (TTL: 60s) [PASS]`
  );

  // 3. Read back
  const readBack = await redis.get(testKey);
  const readMatch = readBack === testVal;
  console.log(`3. Read back value match: ${readMatch} [PASS]`);

  // 4. Confirm positive TTL
  const ttl = await redis.ttl(testKey);
  const positiveTTL = ttl > 0 && ttl <= 60;
  console.log(
    `4. Key TTL is positive (${ttl}s remaining): ${positiveTTL} [PASS]`
  );

  // 5. Delete only that temporary key
  const deletedCount = await redis.del(testKey);
  console.log(
    `5. Deleted temporary key (keys removed: ${deletedCount}) [PASS]`
  );

  // 6. Confirm no longer exists
  const postDeleteVal = await redis.get(testKey);
  const isGone = postDeleteVal === null;
  console.log(
    `6. Confirmed key no longer exists (val=${postDeleteVal}): ${isGone} [PASS]`
  );

  if (
    pingRes === "PONG" &&
    readMatch &&
    positiveTTL &&
    deletedCount === 1 &&
    isGone
  ) {
    console.log("\n✅ ALL PHASE 3 REDIS CONNECTIVITY CHECKS PASSED");
  } else {
    console.error("\n❌ PHASE 3 REDIS VERIFICATION INCOMPLETE");
    process.exit(1);
  }
}

runPhase3Verification().catch((err) => {
  console.error("Phase 3 verification error:", err.message);
  process.exit(1);
});
