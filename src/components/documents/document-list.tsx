// This is just a simple re-export wrapper
// The document-card.tsx already handles the navigation
// But let's add the document list component for cleanliness

"use client";

import { DocumentCard } from "./document-card";
import { NoDocuments } from "@/components/shared/empty-states";
import type { Document } from "@/types/database";

interface DocumentListProps {
  documents: Document[];
}

export function DocumentList({ documents }: DocumentListProps) {
  if (documents.length === 0) {
    return <NoDocuments />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {documents.map((doc) => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
    </div>
  );
}
