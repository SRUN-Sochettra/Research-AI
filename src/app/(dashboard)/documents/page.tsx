import { Suspense } from "react";
import { getSupabaseServerClient } from "@/lib/db/supabase/server";
import { DocumentListSkeleton } from "@/components/shared/loading-states";
import { NoDocuments } from "@/components/shared/empty-states";
import { DocumentCard } from "@/components/documents/document-card";
import { UploadButton } from "@/components/documents/upload-button";
import type { Metadata } from "next";
import type { Document } from "@/types/database";

export const metadata: Metadata = { title: "Documents" };

async function DocumentList() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: documents, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center text-sm text-red-400">
        Failed to load documents. Please try again.
      </div>
    );
  }

  if (!documents || documents.length === 0) return <NoDocuments />;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {documents.map((doc: Document) => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            My{" "}
            <span className="gradient-text">Documents</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Upload PDFs and start asking questions
          </p>
        </div>
        <UploadButton />
      </div>

      {/* Grid */}
      <Suspense fallback={<DocumentListSkeleton />}>
        <DocumentList />
      </Suspense>
    </div>
  );
}