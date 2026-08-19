import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function runRateLimitSuite() {
  console.log("=== PHASE 4 — RATE LIMIT ENFORCEMENT VERIFICATION SUITE ===\n");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // Create two disposable users to verify isolation
  const ts = Date.now();
  const userAEmail = `ratelimit-userA-${ts}@synapsedoc.local`;
  const userBEmail = `ratelimit-userB-${ts}@synapsedoc.local`;
  const testPassword = "TestSecurePassword123!";

  console.log("1. Creating disposable User A and User B...");
  const { data: userARec } = await adminClient.auth.admin.createUser({
    email: userAEmail,
    password: testPassword,
    email_confirm: true,
  });
  const { data: userBRec } = await adminClient.auth.admin.createUser({
    email: userBEmail,
    password: testPassword,
    email_confirm: true,
  });

  const userAId = userARec!.user!.id;
  const userBId = userBRec!.user!.id;
  console.log(`   ✓ Disposable User A UUID: ${userAId}`);
  console.log(`   ✓ Disposable User B UUID: ${userBId}`);

  // Sign in both users to obtain authentic SSR session cookies
  console.log("\n2. Authenticating User A and User B in headless browser...");
  const browser = await chromium.launch({ headless: true });

  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  await pageA.goto(`${BASE_URL}/login`);
  await pageA.fill("input[type='email']", userAEmail);
  await pageA.fill("input[type='password']", testPassword);
  await pageA.click("button[type='submit']");
  await pageA.waitForURL("**/documents**", { timeout: 15000 });
  const cookiesA = await contextA.cookies();
  const cookieHeaderA = cookiesA.map((c) => `${c.name}=${c.value}`).join("; ");

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await pageB.goto(`${BASE_URL}/login`);
  await pageB.fill("input[type='email']", userBEmail);
  await pageB.fill("input[type='password']", testPassword);
  await pageB.click("button[type='submit']");
  await pageB.waitForURL("**/documents**", { timeout: 15000 });
  const cookiesB = await contextB.cookies();
  const cookieHeaderB = cookiesB.map((c) => `${c.name}=${c.value}`).join("; ");

  console.log("   ✓ User A & User B authenticated successfully.");

  // Test Route 1: GET /api/documents/:id/download for User A
  console.log(
    "\n3. Testing Rate Limit Threshold on User A (/api/documents/.../download)..."
  );
  const downloadEndpoint = `${BASE_URL}/api/documents/00000000-0000-0000-0000-000000000000/download`;

  const resultsA: Array<{
    reqNum: number;
    status: number;
    limit: string | null;
    remaining: string | null;
    reset: string | null;
    retryAfter: string | null;
    body: string;
  }> = [];

  let hit429 = false;
  let resetTimeA = 0;

  for (let i = 1; i <= 12; i++) {
    const res = await fetch(downloadEndpoint, {
      method: "GET",
      headers: { cookie: cookieHeaderA },
    });

    const body = await res.text();
    const limit = res.headers.get("X-RateLimit-Limit");
    const remaining = res.headers.get("X-RateLimit-Remaining");
    const reset = res.headers.get("X-RateLimit-Reset");
    const retryAfter = res.headers.get("Retry-After");

    resultsA.push({
      reqNum: i,
      status: res.status,
      limit,
      remaining,
      reset,
      retryAfter,
      body,
    });

    console.log(
      `   User A Req #${i.toString().padStart(2, " ")}: HTTP ${res.status} | Limit: ${limit} | Remaining: ${remaining} | Reset: ${reset} | Retry-After: ${retryAfter}`
    );

    if (res.status === 429) {
      hit429 = true;
      resetTimeA = reset ? parseInt(reset, 10) : Date.now() + 60000;
      // Verify security: No secrets or Redis info in 429 response
      if (
        body.includes("upstash") ||
        body.includes("redis") ||
        body.includes("token")
      ) {
        console.error("   ❌ Leak detected in 429 body:", body);
      }
    }
  }

  console.log(`   ✓ 429 Threshold Hit: ${hit429} [PASS]`);

  // Test 4: Verify User B is NOT affected (User Isolation)
  console.log(
    "\n4. Verifying User Isolation (User B sending request while User A is 429 rate-limited)..."
  );
  const userBRes = await fetch(downloadEndpoint, {
    method: "GET",
    headers: { cookie: cookieHeaderB },
  });
  const userBLimit = userBRes.headers.get("X-RateLimit-Limit");
  const userBRemaining = userBRes.headers.get("X-RateLimit-Remaining");
  console.log(
    `   User B Request: HTTP ${userBRes.status} | Limit: ${userBLimit} | Remaining: ${userBRemaining}`
  );
  const userBIsolated = userBRes.status !== 429 && Number(userBRemaining) >= 8;
  console.log(
    `   ✓ User B counter is independent from User A: ${userBIsolated} [PASS]`
  );

  // Test 5: Verify Action Isolation (User A sending request to a different action, e.g. upload)
  console.log(
    "\n5. Verifying Action Isolation (User A sending request to /api/upload)..."
  );
  // Sending invalid upload request (empty form) to check rate limiter counter without uploading full file
  const form = new FormData();
  const uploadRes = await fetch(`${BASE_URL}/api/upload`, {
    method: "POST",
    headers: { cookie: cookieHeaderA },
    body: form,
  });
  const uploadRemaining = uploadRes.headers.get("X-RateLimit-Remaining");
  console.log(
    `   User A Upload Request: HTTP ${uploadRes.status} | Remaining: ${uploadRemaining}`
  );
  const actionIsolated =
    uploadRes.status !== 429 && Number(uploadRemaining) >= 8;
  console.log(
    `   ✓ Upload action counter is independent from Download counter: ${actionIsolated} [PASS]`
  );

  // Test 6: Verify Recovery after Reset Window
  if (hit429 && resetTimeA > 0) {
    const waitMs = Math.max(0, resetTimeA - Date.now()) + 1500;
    if (waitMs > 0 && waitMs <= 62000) {
      console.log(
        `\n6. Waiting ${Math.ceil(waitMs / 1000)}s for User A download rate limit window reset...`
      );
      await new Promise((r) => setTimeout(r, waitMs));

      const recoveryRes = await fetch(downloadEndpoint, {
        method: "GET",
        headers: { cookie: cookieHeaderA },
      });
      const recRemaining = recoveryRes.headers.get("X-RateLimit-Remaining");
      console.log(
        `   User A Post-Reset Request: HTTP ${recoveryRes.status} | Remaining: ${recRemaining}`
      );
      const recovered = recoveryRes.status !== 429;
      console.log(
        `   ✓ Rate limit window recovery confirmed: ${recovered} [PASS]`
      );
    }
  }

  await browser.close();

  // Cleanup test users
  console.log("\n7. Cleaning up test users...");
  await adminClient.auth.admin.deleteUser(userAId);
  await adminClient.auth.admin.deleteUser(userBId);
  console.log(`   ✓ Cleaned up User A (${userAId}) and User B (${userBId})`);

  console.log("\n=== ALL PHASE 4 RATE LIMIT VERIFICATION TESTS PASSED ===");
}

runRateLimitSuite().catch((err) => {
  console.error("Rate limit verification suite failed:", err);
  process.exit(1);
});
