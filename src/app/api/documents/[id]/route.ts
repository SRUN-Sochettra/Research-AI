import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/db/supabase/server";
import {
  deleteDocument,
  updateDocumentTitle,
} from "@/lib/db/queries/documents";

const updateDocumentSchema = z.object({
  title: z.string().trim().min(1).max(200),
});

async function authenticatedUser() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user } = await authenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: document, error } = await supabase
    .from("documents")
    .select("id, title, status, summary, page_count, updated_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const response = NextResponse.json({
    id: document.id,
    title: document.title,
    status: document.status,
    summary: document.summary,
    pageCount: document.page_count,
    updatedAt: document.updated_at,
  });

  response.headers.set(
    "Cache-Control",
    document.status === "ready"
      ? "private, max-age=300"
      : "private, max-age=5, must-revalidate"
  );
  return response;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user } = await authenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = updateDocumentSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Title must be between 1 and 200 characters" },
      { status: 400 }
    );
  }

  const { data: ownedDocument } = await supabase
    .from("documents")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!ownedDocument) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  await updateDocumentTitle(id, user.id, parsed.data.title);
  return NextResponse.json({ success: true, title: parsed.data.title });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user } = await authenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: ownedDocument } = await supabase
    .from("documents")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!ownedDocument) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  await deleteDocument(id, user.id);
  return NextResponse.json({ success: true });
}
