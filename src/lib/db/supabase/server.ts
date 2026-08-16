// src/lib/db/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables:\n" +
        `  NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "OK" : "Error MISSING"}\n` +
        `  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? "OK" : "Error MISSING"}`
    );
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from Server Component - cookies can't be set
        }
      },
    },
  });
}

// Alias used throughout the codebase
export const getSupabaseServerClient = createClient;
