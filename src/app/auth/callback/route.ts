import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/db/supabase/server";

// Handle OAuth callback from Google
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/documents";

    if (code) {
        const supabase = await getSupabaseServerClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // If error, redirect to login with error
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}