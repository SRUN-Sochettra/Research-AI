import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/db/supabase/server";
import { deleteDocument, updateDocumentTitle } from "@/lib/db/queries/documents";
import { toErrorResponse } from "@/lib/utils/errors";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
});

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

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { title } = updateSchema.parse(body);

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

        await updateDocumentTitle(id, user.id, title);

        return NextResponse.json({ success: true });
    } catch (error) {
        const err = toErrorResponse(error);
        return NextResponse.json(
            { error: err.message },
            { status: err.statusCode }
        );
    }
}
