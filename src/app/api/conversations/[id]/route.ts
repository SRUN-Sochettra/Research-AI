import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/db/supabase/server";
import {
  deleteConversation,
  renameConversation,
} from "@/lib/db/queries/conversations";
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteConversation(id, user.id);

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
    const { title } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversation = await renameConversation(id, user.id, title);

    return NextResponse.json({ success: true, conversation });
  } catch (error) {
    const err = toErrorResponse(error);
    return NextResponse.json(
      { error: err.message },
      { status: err.statusCode }
    );
  }
}
