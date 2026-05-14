import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/db/supabase/server";
import { deleteDocument } from "@/lib/db/queries/documents";
import { toErrorResponse } from "@/lib/utils/errors";

export async function DELETE(
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

        await deleteDocument(id, user.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        const err = toErrorResponse(error);
        return NextResponse.json(
            { error: err.message },
            { status: err.statusCode }
        );
    }
}