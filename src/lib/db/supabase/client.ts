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

  // createBrowserClient handles its own singleton internally via @supabase/ssr
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export function getSupabaseBrowserClient() {
  return createClient();
}

export { createClient };
