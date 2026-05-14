import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/db/supabase/admin";

export const dynamic = "force-dynamic";

async function checkSupabase(): Promise<boolean> {
  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);
    return !error;
  } catch {
    return false;
  }
}

export async function GET() {
  const startTime = Date.now();

  const [supabaseHealthy] = await Promise.allSettled([
    checkSupabase(),
  ]);

  const services = {
    supabase:
      supabaseHealthy.status === "fulfilled" &&
      supabaseHealthy.value,
    gemini: !!process.env.GOOGLE_API_KEY,
    upstash: !!process.env.UPSTASH_REDIS_REST_URL,
  };

  const allHealthy = Object.values(services).every(Boolean);
  const latencyMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "1.0.0",
      latencyMs,
      services,
    },
    { status: allHealthy ? 200 : 503 }
  );
}