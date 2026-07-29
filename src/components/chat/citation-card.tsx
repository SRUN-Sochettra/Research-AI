"use client";

import { Badge } from "@/components/ui/badge";
import { FileText, Hash } from "lucide-react";
import type { Citation } from "@/types/database";

interface CitationCardProps {
  citation: Citation;
  index: number;
}

export function CitationCard({ citation, index }: CitationCardProps) {
  const relevancePercent = Math.round(citation.similarity * 100);

  return (
    <div className="bg-card rounded-lg border p-3 text-xs shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="bg-primary text-primary-foreground flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold">
            {index}
          </div>
          <FileText className="text-muted-foreground h-3 w-3" />
          <span className="text-muted-foreground font-medium">
            Source {index}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {citation.pageNumber && (
            <Badge variant="outline" className="h-5 gap-1 px-1.5 text-[10px]">
              <Hash className="h-2.5 w-2.5" />
              Page {citation.pageNumber}
            </Badge>
          )}
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
            {relevancePercent}% match
          </Badge>
        </div>
      </div>

      {/* Snippet */}
      <p className="text-muted-foreground line-clamp-3 leading-relaxed">
        &ldquo;{citation.snippet}&rdquo;
      </p>
    </div>
  );
}
