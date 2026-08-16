import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, FileText, MessageSquare } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/db/supabase/server";
import { formatDate } from "@/lib/utils/helpers";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Overview" };
export default async function DashboardPage() {
  const s = await getSupabaseServerClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: docs }, { data: chats }] = await Promise.all([
    s
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    s
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);
  const Row = ({
    href,
    title,
    date,
    type,
  }: {
    href: string;
    title: string;
    date: string;
    type: "doc" | "chat";
  }) => (
    <Link
      href={href}
      className="group flex items-center gap-4 border-b py-4 last:border-b-0"
    >
      <span className="bg-muted/30 grid size-9 place-items-center border">
        {type === "doc" ? (
          <FileText className="size-4" />
        ) : (
          <MessageSquare className="size-4" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{title}</span>
        <span className="text-muted-foreground mt-1 block font-mono text-[10px] uppercase">
          {formatDate(date)}
        </span>
      </span>
      <ArrowUpRight className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  );
  return (
    <div>
      <div className="border-b pb-9">
        <p className="eyebrow">Workspace overview</p>
        <h1 className="display-serif mt-4 text-5xl sm:text-6xl">
          What are we reading?
        </h1>
        <p className="text-muted-foreground mt-4 max-w-xl">
          Return to recent evidence or open a new line of inquiry.
        </p>
      </div>
      <div className="grid gap-10 pt-9 lg:grid-cols-2">
        <section>
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">Library</p>
              <h2 className="display-serif mt-2 text-3xl">Recent documents</h2>
            </div>
            <Link
              href="/documents"
              className="text-primary text-sm hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-5 border-t">
            {docs?.length ? (
              docs.map((d) => (
                <Row
                  key={d.id}
                  href={`/chat/${d.id}`}
                  title={d.title}
                  date={d.created_at}
                  type="doc"
                />
              ))
            ) : (
              <p className="text-muted-foreground py-10 text-sm">
                No documents yet.{" "}
                <Link href="/documents" className="text-primary">
                  Upload your first PDF.
                </Link>
              </p>
            )}
          </div>
        </section>
        <section>
          <p className="eyebrow">Threads</p>
          <h2 className="display-serif mt-2 text-3xl">Recent conversations</h2>
          <div className="mt-5 border-t">
            {chats?.length ? (
              chats.map((c) => (
                <Row
                  key={c.id}
                  href={
                    c.document_id
                      ? `/chat/${c.document_id}?conversationId=${c.id}`
                      : "/chat/multi"
                  }
                  title={c.title}
                  date={c.updated_at}
                  type="chat"
                />
              ))
            ) : (
              <p className="text-muted-foreground py-10 text-sm">
                Conversations will appear after you question a document.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
