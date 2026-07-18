export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/db/supabase/server";
import { ChatPageClient } from "@/components/chat/chat-page-client";
import { DocumentSelector } from "@/components/chat/document-selector";
import type { Metadata } from "next";

interface PageProps {
  searchParams: Promise<{ docs?: string | string[], conversationId?: string }>;
}

export const metadata: Metadata = {
  title: "Multi-Document Chat",
};

export default async function MultiChatPage({ searchParams }: PageProps) {
  const { docs, conversationId } = await searchParams;
  let documentIds: string[] = [];

  if (typeof docs === "string") {
    documentIds = [docs];
  } else if (Array.isArray(docs)) {
    documentIds = docs;
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return notFound();

  // If no docs selected, show the selector
  if (documentIds.length === 0) {
    const { data: allDocs } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    return <DocumentSelector documents={allDocs || []} />;
  }

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .in("id", documentIds)
    .eq("user_id", user.id);

  if (!documents || documents.length === 0) return notFound();

  const activeConversationId = conversationId ?? null;

  return (
    <ChatPageClient
      document={documents[0]}
      documentIds={documentIds}
      conversations={[]}
      initialMessages={[]}
      initialConversationId={activeConversationId}
    />
  );
}
