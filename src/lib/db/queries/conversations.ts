import { getSupabaseAdminClient } from "@/lib/db/supabase/admin";
import { getSupabaseServerClient } from "@/lib/db/supabase/server";
import type { Conversation, Message, Citation, TokenUsage } from "@/types/database";

export async function getOrCreateConversation(
  userId: string,
  documentId: string,
  conversationId?: string
): Promise<Conversation> {
  const supabase = getSupabaseAdminClient();

  // If ID provided, fetch existing
  if (conversationId) {
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("user_id", userId)
      .single();

    if (data) return data;
  }

  // Create new conversation
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      document_id: documentId,
      title: "New Conversation",
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create conversation: ${error?.message}`);
  }

  return data;
}

export async function getConversationMessages(
  conversationId: string,
  limit = 20
): Promise<Message[]> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }

  return data ?? [];
}

export async function saveMessage(data: {
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations?: Citation[];
  tokenUsage?: TokenUsage;
  latencyMs?: number;
}): Promise<Message> {
  const supabase = getSupabaseAdminClient();

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: data.conversationId,
      role: data.role,
      content: data.content,
      citations: (data.citations ?? []) as any,
      token_usage: (data.tokenUsage ?? null) as any,
      latency_ms: data.latencyMs ?? null,
    })
    .select()
    .single();

  if (error || !message) {
    throw new Error(`Failed to save message: ${error?.message}`);
  }

  return message;
}

export async function getConversationsByDocument(
  documentId: string,
  userId: string
): Promise<Conversation[]> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("document_id", documentId)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}