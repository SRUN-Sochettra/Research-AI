"use client";

import { useState } from "react";
import type { Document } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  File as FileIcon,
  Calendar,
  Layers,
  FileArchive,
} from "lucide-react";
import { formatDate } from "@/lib/utils/helpers";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NoDocuments } from "@/components/shared/empty-states";
import { DiffViewer } from "@/components/documents/diff-viewer";

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function CompareClient({
  documents,
}: {
  documents: Document[];
}) {
  const [doc1Id, setDoc1Id] = useState<string | null>(null);
  const [doc2Id, setDoc2Id] = useState<string | null>(null);

  if (documents.length === 0) return <NoDocuments />;

  const doc1 = documents.find((d) => d.id === doc1Id);
  const doc2 = documents.find((d) => d.id === doc2Id);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-muted-foreground text-sm font-medium">
            Select First Document
          </label>
          <select
            value={doc1Id || ""}
            onChange={(e) => setDoc1Id(e.target.value)}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>
              Select a document...
            </option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-muted-foreground text-sm font-medium">
            Select Second Document
          </label>
          <select
            value={doc2Id || ""}
            onChange={(e) => setDoc2Id(e.target.value)}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>
              Select a document...
            </option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <DocumentDetailCard doc={doc1} />
        <DocumentDetailCard doc={doc2} />
      </div>

      {doc1?.summary && doc2?.summary && (
        <DiffViewer oldText={doc1.summary} newText={doc2.summary} />
      )}
    </div>
  );
}

function DocumentDetailCard({ doc }: { doc?: Document }) {
  if (!doc)
    return (
      <Card className="bg-muted/20 flex h-96 items-center justify-center border-dashed">
        <p className="text-muted-foreground">No document selected</p>
      </Card>
    );
  const isReady = doc.status === "ready";
  return (
    <Card className="border-border bg-card flex h-[600px] flex-col">
      <CardHeader className="border-border border-b pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="text-primary h-5 w-5" />
              {doc.title}
            </CardTitle>
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1">
                <FileArchive className="h-3 w-3" />
                {doc.file_name}
              </span>
            </div>
          </div>
          <Badge
            variant={isReady ? "default" : "secondary"}
            className={
              isReady
                ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
            }
          >
            {doc.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
        <div className="bg-muted grid grid-cols-2 gap-px">
          <div className="bg-background/50 flex items-center gap-2 p-4">
            <FileIcon className="text-primary h-4 w-4" />
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Size</span>
              <span className="text-sm font-medium">
                {formatBytes(doc.file_size)}
              </span>
            </div>
          </div>
          <div className="bg-background/50 flex items-center gap-2 p-4">
            <Layers className="text-primary h-4 w-4" />
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Pages</span>
              <span className="text-sm font-medium">
                {doc.page_count || "-"}
              </span>
            </div>
          </div>
          <div className="bg-background/50 col-span-2 flex items-center gap-2 p-4">
            <Calendar className="h-4 w-4 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Uploaded</span>
              <span className="text-sm font-medium">
                {doc.created_at ? formatDate(doc.created_at) : "-"}
              </span>
            </div>
          </div>
        </div>
        <div className="border-border flex flex-1 flex-col overflow-hidden border-t p-4">
          <h4 className="text-muted-foreground mb-2 text-sm font-medium">
            AI Summary
          </h4>
          <ScrollArea className="flex-1 pr-4">
            {doc.summary ? (
              <div className="prose prose-sm prose-invert text-muted-foreground max-w-none">
                {doc.summary}
              </div>
            ) : (
              <div className="text-muted-foreground flex h-full items-center justify-center text-sm italic">
                {isReady ? "No summary available" : "Summary is generating..."}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
