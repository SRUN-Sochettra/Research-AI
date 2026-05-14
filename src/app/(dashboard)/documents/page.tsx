// src/app/(dashboard)/documents/page.tsx
import { Suspense } from "react";
import { getSupabaseServerClient } from "@/lib/db/supabase/server";
import { DocumentListSkeleton } from "@/components/shared/loading-states";
import { NoDocuments } from "@/components/shared/empty-states";
import { DocumentCard } from "@/components/documents/document-card";
import { UploadButton } from "@/components/documents/upload-button";
import type { Metadata } from "next";
import type { Document } from "@/types/database";

export const metadata: Metadata = {
  title: "Documents",
};

async function DocumentList() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: documents, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching documents:", error);
    return (
      <div className="text-center text-destructive">
        Failed to load documents. Please try again.
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return <NoDocuments />;
  }

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Upload PDFs and start asking questions
          </p>
        </div>
        <UploadButton />
      </div>

      {/* Document Grid */}
      <Suspense fallback={<DocumentListSkeleton />}>
        <DocumentList />
      </Suspense>
    </div>
  );
}