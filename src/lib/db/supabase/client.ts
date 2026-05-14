// src/lib/db/supabase/client.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";

function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Check your .env.local file:\n" +
      `  NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "✓" : "✗ MISSING"}\n` +
      `  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? "✓" : "✗ MISSING"}`
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Singleton instance to avoid creating multiple clients
let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!client) {
    client = createClient();
  }
  return client;
}

export { createClient };