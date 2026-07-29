"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Document } from "@/types/database";
import { CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils/helpers";

export function DocumentSelector({ documents }: { documents: Document[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const handleStartChat = () => {
    if (selected.size === 0) return;
    const params = new URLSearchParams();
    selected.forEach((id) => params.append("docs", id));
    router.push(`/chat/multi?${params.toString()}`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Select Documents</h2>
        <p className="text-muted-foreground">
          Choose multiple documents to chat with them simultaneously.
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="bg-muted/20 rounded-xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground text-sm">
            No documents found. Please upload some first.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => {
            const isSelected = selected.has(doc.id);
            const isReady = doc.status === "ready";
            return (
              <div
                key={doc.id}
                onClick={() => isReady && toggleSelection(doc.id)}
                className={`relative cursor-pointer rounded-xl border p-4 transition-all ${
                  isSelected
                    ? "border-violet-500 bg-violet-500/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                } ${!isReady ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-foreground line-clamp-1 text-sm font-medium">
                      {doc.title}
                    </h3>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {formatDate(doc.created_at)}
                    </p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-violet-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end border-t border-white/10 pt-4">
        <Button
          onClick={handleStartChat}
          disabled={selected.size === 0}
          className="bg-violet-600 text-white hover:bg-violet-700"
        >
          Start Chat ({selected.size})
        </Button>
      </div>
    </div>
  );
}
