import { getSupabaseServerClient } from "@/lib/db/supabase/server";
import { redirect } from "next/navigation";
import CompareClient from "./compare-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Compare Documents" };

export default async function ComparePage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: documents, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-md border border-red-500/20 bg-red-500/10 p-4 text-center text-sm text-red-400">
        Failed to load documents. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Compare <span className="gradient-text">Documents</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            View details and summaries of two documents side-by-side
          </p>
        </div>
      </div>
      <CompareClient documents={documents || []} />
    </div>
  );
}
