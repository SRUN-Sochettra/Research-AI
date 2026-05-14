import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/db/supabase/server";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const supabase = await getSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const { data: document, error } = await supabase
        .from("documents")
        .select("id, status, summary, page_count, updated_at")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

    if (error || !document) {
        return NextResponse.json(
            { error: "Document not found" },
            { status: 404 }
        );
    }

    const response = NextResponse.json({
        id: document.id,
        status: document.status,
        summary: document.summary,
        pageCount: document.page_count,
        updatedAt: document.updated_at,
    });

    // Cache ready documents longer — they won't change
    // Cache processing documents briefly for polling
    if (document.status === "ready") {
        response.headers.set(
            "Cache-Control",
            "private, max-age=300" // 5 min for ready docs
        );
    } else {
        response.headers.set(
            "Cache-Control",
            "private, max-age=5, must-revalidate" // 5s for processing
        );
    }

    return response;
}