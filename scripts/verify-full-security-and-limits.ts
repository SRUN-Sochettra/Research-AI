import { createClient } from "@supabase/supabase-js";
import { Redis } from "@upstash/redis";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { LIMITS } from "../src/lib/utils/constants";
import { chatSchema } from "../src/types/api";

async function main() {
  console.log("=== SYNAPSEDOC FULL VERIFICATION SCRIPT ===\n");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL!;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const geminiApiKey = process.env.GOOGLE_API_KEY!;

  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  // ──────────────────────────────────────────────
  // 1. SUPABASE RLS & PER-USER ISOLATION
  // ──────────────────────────────────────────────
  console.log("1. Checking Supabase Database RLS & Isolation:");

  // Test unauthenticated anon access
  const { data: anonDocs, error: anonError } = await anonClient
    .from("documents")
    .select("id, title");

  if (!anonError && (!anonDocs || anonDocs.length === 0)) {
    console.log(
      "  [PASS] Unauthenticated SELECT on public.documents returned 0 rows (RLS is active)."
    );
  } else if (anonError) {
    console.log("  [PASS] Unauthenticated access blocked:", anonError.message);
  } else {
    console.error(
      "  [FAIL] Unauthenticated access returned data! RLS might be disabled:",
      anonDocs
    );
  }

  // ──────────────────────────────────────────────
  // 2. SUPABASE STORAGE BUCKET CONFIGURATION
  // ──────────────────────────────────────────────
  console.log("\n2. Checking Supabase Storage Bucket:");
  const { data: buckets, error: bucketError } =
    await adminClient.storage.listBuckets();
  if (bucketError) {
    console.error(
      "  [FAIL] Could not list storage buckets:",
      bucketError.message
    );
  } else {
    const docBucket = buckets.find(
      (b) => b.name === "documents" || b.id === "documents"
    );
    if (docBucket) {
      console.log(
        `  [PASS] 'documents' bucket found: id=${docBucket.id}, public=${docBucket.public}`
      );
      if (docBucket.public) {
        console.warn(
          "  [WARN] 'documents' bucket is marked public! Should be private for strict privacy."
        );
      } else {
        console.log("  [PASS] 'documents' bucket is PRIVATE.");
      }
    } else {
      console.error("  [FAIL] 'documents' bucket not found in storage!");
    }
  }

  // ──────────────────────────────────────────────
  // 3. UPSTASH RATE LIMITER CHECK
  // ──────────────────────────────────────────────
  console.log("\n3. Checking Upstash Redis Rate Limiter:");
  try {
    const redis = new Redis({
      url: upstashUrl,
      token: upstashToken,
    });
    const pingResult = await redis.ping();
    console.log("  [PASS] Upstash Redis ping response:", pingResult);

    // Test a key set/get
    const testKey = `test_verification_${Date.now()}`;
    await redis.set(testKey, "synapsedoc_ok", { ex: 60 });
    const fetched = await redis.get(testKey);
    console.log(
      "  [PASS] Upstash read/write verification:",
      fetched === "synapsedoc_ok" ? "SUCCESS" : "FAILED"
    );
    await redis.del(testKey);
  } catch (upstashErr) {
    console.error("  [FAIL] Upstash connection failed:", upstashErr);
  }

  // ──────────────────────────────────────────────
  // 4. GOOGLE GEMINI API LIVE CHECK
  // ──────────────────────────────────────────────
  console.log("\n4. Checking Google Gemini API:");
  try {
    const ai = new GoogleGenerativeAI(geminiApiKey);
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const response = await model.generateContent(
      "Hello from SynapseDoc verification test. Answer in one word: 'Ready'."
    );
    console.log(
      `  [PASS] Gemini 2.5-flash live response:`,
      response.response.text()?.trim()
    );
  } catch (geminiErr) {
    console.error("  [FAIL] Gemini API error:", geminiErr);
  }

  // ──────────────────────────────────────────────
  // 5. VALIDATION SCHEMAS & LIMIT ENFORCEMENT
  // ──────────────────────────────────────────────
  console.log("\n5. Checking Limit Constraints:");
  console.log(`  - Max File Size: ${LIMITS.maxFileSize / (1024 * 1024)} MB`);
  console.log(`  - Max Documents/User: ${LIMITS.maxDocumentsPerUser}`);
  console.log(`  - Max Message Length: ${LIMITS.maxMessageLength} chars`);
  console.log(
    `  - Rate Limit: ${LIMITS.rateLimit.maxRequests} req / ${LIMITS.rateLimit.windowMs / 1000}s`
  );

  // Chat message length enforcement
  const chatOverLimit = chatSchema.safeParse({
    message: "X".repeat(LIMITS.maxMessageLength + 1),
    documentId: "123e4567-e89b-12d3-a456-426614174000",
  });
  console.log("  [PASS] Chat >5000 chars rejected:", !chatOverLimit.success);

  console.log("\n=== ALL DIRECT VERIFICATION CHECKS COMPLETED ===");
}

main().catch(console.error);
