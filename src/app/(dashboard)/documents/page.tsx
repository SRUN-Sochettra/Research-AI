import { Suspense } from "react";
import { getSupabaseServerClient } from "@/lib/db/supabase/server";
import { DocumentListSkeleton } from "@/components/shared/loading-states";
import { NoDocuments } from "@/components/shared/empty-states";
import { DocumentCard } from "@/components/documents/document-card";
import { UploadButton } from "@/components/documents/upload-button";
import { DocumentFilters } from "@/components/documents/document-filters";
import type { Metadata } from "next";
import type { Document } from "@/types/database";

export const metadata: Metadata = { title: "Documents" };

interface DocumentListProps {
  query?: string;
  sort?: string;
}

async function DocumentList({ query, sort }: DocumentListProps) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let dbQuery = supabase.from("documents").select("*").eq("user_id", user.id);

  if (query) {
    dbQuery = dbQuery.ilike("title", `%${query}%`);
  }

  switch (sort) {
    case "oldest":
      dbQuery = dbQuery.order("created_at", { ascending: true });
      break;
    case "largest":
      dbQuery = dbQuery.order("file_size", { ascending: false });
      break;
    case "smallest":
      dbQuery = dbQuery.order("file_size", { ascending: true });
      break;
    case "newest":
    default:
      dbQuery = dbQuery.order("created_at", { ascending: false });
      break;
  }

  const { data: documents, error } = await dbQuery;

  if (error) {
    return (
      <div className="rounded-md border border-red-500/20 bg-red-500/10 p-4 text-center text-sm text-red-400">
        Failed to load documents. Please try again.
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    if (query) {
      return (
        <div className="bg-muted/20 flex flex-col items-center justify-center rounded-md border border-dashed p-12 text-center">
          <h3 className="mt-4 text-lg font-semibold">No results found</h3>
          <p className="text-muted-foreground mt-2 text-sm">
            No documents matched your search query &quot;{query}&quot;.
          </p>
        </div>
      );
    }
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

interface DocumentsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DocumentsPage(props: DocumentsPageProps) {
  const searchParams = await props.searchParams;
  const query =
    typeof searchParams.query === "string" ? searchParams.query : undefined;
  const sort =
    typeof searchParams.sort === "string" ? searchParams.sort : undefined;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Documents</h1>
          <p className="text-muted-foreground mt-1">
            Upload PDFs and start asking questions
          </p>
        </div>
        <UploadButton />
      </div>

      <DocumentFilters />

      {/* Grid */}
      <Suspense fallback={<DocumentListSkeleton />} key={`${query}-${sort}`}>
        <DocumentList query={query} sort={sort} />
      </Suspense>
    </div>
  );
}
