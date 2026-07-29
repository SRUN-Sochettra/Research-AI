import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/db/supabase/server";
import {
  getConversationsByDocument,
  getConversationMessages,
} from "@/lib/db/queries/conversations";
import { ChatPageClient } from "@/components/chat/chat-page-client";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ documentId: string }>;
  searchParams: Promise<{ conversationId?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { documentId } = await params;
  const supabase = await getSupabaseServerClient();

  const { data } = await supabase
    .from("documents")
    .select("title")
    .eq("id", documentId)
    .single();

  return {
    title: data ? `Chat: ${data.title}` : "Chat",
  };
}

export default async function ChatPage({ params, searchParams }: PageProps) {
  const { documentId } = await params;
  const { conversationId } = await searchParams;

  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return notFound();

  // Fetch document
  const { data: document } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .single();

  if (!document) return notFound();

  // Fetch all conversations for this document
  const conversations = await getConversationsByDocument(documentId, user.id);

  // Load messages for the selected (or most recent) conversation
  const activeConversationId = conversationId ?? conversations[0]?.id ?? null;

  const initialMessages = activeConversationId
    ? await getConversationMessages(activeConversationId, 50)
    : [];

  return (
    <ChatPageClient
      document={document}
      conversations={conversations}
      initialMessages={initialMessages}
      initialConversationId={activeConversationId}
    />
  );
}
