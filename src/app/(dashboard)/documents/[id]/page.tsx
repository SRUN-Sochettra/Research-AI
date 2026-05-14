import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/db/supabase/server";
import { DocumentDetail } from "@/components/documents/document-details";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();

  const { data } = await supabase
    .from("documents")
    .select("title")
    .eq("id", id)
    .single();

  return {
    title: data?.title ?? "Document",
  };
}

export default async function DocumentPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return notFound();

  const { data: document } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!document) return notFound();

  return <DocumentDetail document={document} />;
}