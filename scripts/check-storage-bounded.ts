import { createClient } from "@supabase/supabase-js";

async function main() {
  const startTime = Date.now();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.log("ERROR: Missing required Supabase environment variables");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false },
  });

  let timer: NodeJS.Timeout | null = null;

  const timeoutPromise = new Promise<{ isTimeout: true }>((resolve) => {
    timer = setTimeout(() => {
      resolve({ isTimeout: true });
    }, 15000);
  });

  try {
    const listPromise = supabase.storage.listBuckets().then((res) => ({
      isTimeout: false as const,
      data: res.data,
      error: res.error,
    }));

    const result = await Promise.race([listPromise, timeoutPromise]);

    if (timer) clearTimeout(timer);

    if (result.isTimeout) {
      console.log(
        "TIMEOUT: Supabase Storage API did not respond within 15 seconds"
      );
      process.exit(1);
    }

    if (result.error) {
      console.log(
        `ERROR: ${result.error.name || "StorageError"}: ${result.error.message}`
      );
      process.exit(1);
    }

    const buckets = result.data || [];
    const docBucket = buckets.find(
      (b) => b.id === "documents" || b.name === "documents"
    );

    if (!docBucket) {
      console.log("FAIL: bucket missing");
      process.exit(1);
    }

    const elapsed = Date.now() - startTime;
    if (docBucket.public === false) {
      console.log(
        `PASS: documents bucket exists and public=false (elapsed: ${elapsed}ms)`
      );
      process.exit(0);
    } else {
      console.log(
        `FAIL: documents bucket exists but is public (expected private, elapsed: ${elapsed}ms)`
      );
      process.exit(1);
    }
  } catch (err) {
    if (timer) clearTimeout(timer);
    const msg =
      err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.log(`ERROR: ${msg}`);
    process.exit(1);
  }
}

main();
