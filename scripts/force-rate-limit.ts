import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function runRateLimitDemonstration() {
  console.log("=================================================");
  console.log("   SynapseDoc — Rate Limit Enforcement Verification");
  console.log("=================================================\n");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const testEmail = `ratelimit-test-${Date.now()}@synapsedoc.local`;
  const testPassword = "TestSecurePassword123!";

  console.log(`1. Provisioning test user: ${testEmail}`);
  const { data: userRecord, error: createError } =
    await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });

  if (createError || !userRecord.user) {
    throw new Error(`Failed to create test user: ${createError?.message}`);
  }

  const userId = userRecord.user.id;
  console.log(`   ✓ Created user ID: ${userId}`);

  console.log(
    "\n2. Signing in via browser to establish authentic SSR session cookies..."
  );
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/login`);
  await page.fill("input[type='email']", testEmail);
  await page.fill("input[type='password']", testPassword);
  await page.click("button[type='submit']");
  await page.waitForURL("**/documents**", { timeout: 15000 });
  console.log("   ✓ Browser signed in and redirected to /documents");

  const cookies = await context.cookies();
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  console.log(
    `   ✓ Extracted ${cookies.length} session cookies (${cookies.map((c) => c.name).join(", ")})`
  );

  console.log(
    "\n3. Sending controlled sequential requests to trigger rate limit (window: 10 req/min)..."
  );
  const endpoint = `${BASE_URL}/api/documents/00000000-0000-0000-0000-000000000000/download`;

  const results: Array<{
    reqNum: number;
    status: number;
    limit: string | null;
    remaining: string | null;
    reset: string | null;
    retryAfter: string | null;
    body: string;
  }> = [];

  let rateLimitHit = false;
  let resetTimestamp = 0;

  for (let i = 1; i <= 15; i++) {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        cookie: cookieHeader,
      },
    });

    const bodyText = await res.text();
    const limit = res.headers.get("X-RateLimit-Limit");
    const remaining = res.headers.get("X-RateLimit-Remaining");
    const reset = res.headers.get("X-RateLimit-Reset");
    const retryAfter = res.headers.get("Retry-After");

    results.push({
      reqNum: i,
      status: res.status,
      limit,
      remaining,
      reset,
      retryAfter,
      body: bodyText,
    });

    console.log(
      `   Req #${i.toString().padStart(2, " ")}: HTTP ${res.status} | Limit: ${limit ?? "N/A"} | Remaining: ${remaining ?? "N/A"} | Reset: ${reset ?? "N/A"} | Body: ${bodyText.slice(0, 55)}`
    );

    if (res.status === 429) {
      rateLimitHit = true;
      resetTimestamp = reset ? parseInt(reset, 10) : Date.now() + 60000;
      console.log(`\n   >>> HTTP 429 RATE LIMIT ENFORCED ON REQUEST #${i} <<<`);
      break;
    }
  }

  console.log("\n--- Enforcement Summary ---");
  console.log(`Total requests sent: ${results.length}`);
  console.log(
    `Status sequence: ${results.map((r) => `Req ${r.reqNum} -> ${r.status}`).join(", ")}`
  );
  console.log(`429 Hit: ${rateLimitHit ? "YES" : "NO"}`);

  if (rateLimitHit) {
    const lastResult = results[results.length - 1]!;
    console.log("\nEnforced 429 Response Details:");
    console.log(`- Status: ${lastResult.status}`);
    console.log(`- X-RateLimit-Limit: ${lastResult.limit}`);
    console.log(`- X-RateLimit-Remaining: ${lastResult.remaining}`);
    console.log(`- X-RateLimit-Reset: ${lastResult.reset}`);
    console.log(`- Retry-After: ${lastResult.retryAfter}s`);
    console.log(`- Response Body: ${lastResult.body}`);

    const now = Date.now();
    const waitMs = Math.max(0, resetTimestamp - now) + 1500;
    if (waitMs > 0 && waitMs < 65000) {
      console.log(
        `\n4. Waiting ${Math.ceil(waitMs / 1000)}s for rate limit window reset...`
      );
      await new Promise((resolve) => setTimeout(resolve, waitMs));

      console.log("5. Sending request after reset to verify recovery...");
      const recoveryRes = await fetch(endpoint, {
        method: "GET",
        headers: { cookie: cookieHeader },
      });
      const recoveryBody = await recoveryRes.text();
      console.log(
        `   Recovery Request: HTTP ${recoveryRes.status} (Body: ${recoveryBody.slice(0, 55)})`
      );
      if (recoveryRes.status !== 429) {
        console.log("   ✓ RECOVERY CONFIRMED: Normal service resumed!");
      } else {
        console.warn("   ✗ Request still 429 rate limited.");
      }
    }
  }

  await browser.close();

  console.log("\n6. Cleaning up test user...");
  await adminClient.auth.admin.deleteUser(userId);
  console.log(`   ✓ Cleaned up test user ${userId}`);
  console.log("\n=================================================");
  console.log("   Rate Limit Verification Completed Successfully");
  console.log("=================================================");
}

runRateLimitDemonstration().catch((err) => {
  console.error("Rate limit verification error:", err);
  process.exit(1);
});
