import { getSupabaseServerClient } from "@/lib/db/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, MessageSquare, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils/helpers";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard Overview" };

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch recent documents
  const { data: recentDocuments } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch recent conversations
  const { data: recentConversations } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard <span className="gradient-text">Overview</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Recent activity across your documents and chats
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-white/10 bg-white/[0.02] flex flex-col h-full">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-violet-400" />
              Recent Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {recentDocuments && recentDocuments.length > 0 ? (
              <div className="divide-y divide-white/5">
                {recentDocuments.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/chat/${doc.id}`}
                    className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600/20 to-blue-600/10 ring-1 ring-white/8">
                      <FileText className="h-5 w-5 text-violet-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{doc.title}</p>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(doc.created_at)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex h-40 flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <FileText className="mb-2 h-8 w-8 opacity-20" />
                <p className="text-sm">No documents found</p>
                <Link href="/documents" className="mt-2 text-xs text-violet-400 hover:underline">
                  Upload your first PDF
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.02] flex flex-col h-full">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <MessageSquare className="h-5 w-5 text-blue-400" />
              Recent Conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {recentConversations && recentConversations.length > 0 ? (
              <div className="divide-y divide-white/5">
                {recentConversations.map((conv) => (
                  <Link
                    key={conv.id}
                    href={`/chat/${conv.document_id}?conversationId=${conv.id}`}
                    className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600/20 to-cyan-600/10 ring-1 ring-white/8">
                      <MessageSquare className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{conv.title}</p>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(conv.updated_at)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex h-40 flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <MessageSquare className="mb-2 h-8 w-8 opacity-20" />
                <p className="text-sm">No conversations found</p>
                <Link href="/documents" className="mt-2 text-xs text-blue-400 hover:underline">
                  Start a chat from a document
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
