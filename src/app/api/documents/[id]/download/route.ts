import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/db/supabase/server";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
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

        const { data: doc, error: docError } = await supabase
            .from("documents")
            .select("file_path, file_name, title")
            .eq("id", id)
            .eq("user_id", user.id)
            .single();

        if (docError || !doc) {
            return NextResponse.json(
                { error: "Document not found" },
                { status: 404 }
            );
        }

        const { data, error: storageError } = await supabase.storage
            .from("documents")
            .createSignedUrl(doc.file_path, 60, {
                download: doc.file_name || doc.title,
            });

        if (storageError || !data?.signedUrl) {
            return NextResponse.json(
                { error: "Failed to generate download URL" },
                { status: 500 }
            );
        }

        return NextResponse.redirect(data.signedUrl);
    } catch (_error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
