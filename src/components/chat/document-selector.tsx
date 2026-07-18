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
    selected.forEach(id => params.append("docs", id));
    router.push(`/chat/multi?${params.toString()}`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Select Documents</h2>
        <p className="text-muted-foreground">Choose multiple documents to chat with them simultaneously.</p>
      </div>

      {documents.length === 0 ? (
        <div className="p-12 text-center border rounded-xl border-dashed bg-muted/20">
          <p className="text-sm text-muted-foreground">No documents found. Please upload some first.</p>
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
                className={`relative p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-violet-500 bg-violet-500/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                } ${!isReady ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="line-clamp-1 text-sm font-medium text-foreground">
                      {doc.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(doc.created_at)}
                    </p>
                  </div>
                  {isSelected && <CheckCircle2 className="h-5 w-5 text-violet-500 shrink-0" />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-white/10">
        <Button
          onClick={handleStartChat}
          disabled={selected.size === 0}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          Start Chat ({selected.size})
        </Button>
      </div>
    </div>
  );
}
