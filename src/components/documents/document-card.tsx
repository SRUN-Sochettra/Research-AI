"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  MessageSquare,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  BookOpen,
  ArrowRight,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { formatDate, formatFileSize } from "@/lib/utils/helpers";
import type { Document } from "@/types/database";

interface StatusConfig {
  label: string;
  icon: React.ElementType;
  dotClass: string;
  badgeClass: string;
  animate?: boolean;
}

const statusConfig: Record<string, StatusConfig> = {
  uploaded: {
    label: "Queued",
    icon: Clock,
    dotClass: "status-warning",
    badgeClass: "border-amber-500/20 bg-amber-500/8 text-amber-400",
  },
  processing: {
    label: "Processing",
    icon: Loader2,
    dotClass: "status-online",
    badgeClass: "border-primary/20 bg-primary/8 text-primary",
    animate: true,
  },
  ready: {
    label: "Ready",
    icon: CheckCircle2,
    dotClass: "status-online",
    badgeClass: "border-emerald-500/20 bg-emerald-500/8 text-emerald-400",
  },
  error: {
    label: "Error",
    icon: AlertCircle,
    dotClass: "status-error",
    badgeClass: "border-red-500/20 bg-red-500/8 text-red-400",
  },
};

export function DocumentCard({ document }: { document: Document }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Delete failed");
      toast.success("Document deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete document");
      setIsDeleting(false);
    }
  };

  const status = statusConfig[document.status] ?? statusConfig["uploaded"]!;
  const StatusIcon = status.icon;
  const isReady = document.status === "ready";
  const isProcessing = document.status === "processing";

  return (
    <div className="card-interactive group border-border bg-card relative flex flex-col overflow-hidden rounded-md border transition-all duration-300 hover:border-white/12 hover:bg-white/[0.03]">
      {/* Top gradient accent — visible on hover */}
      <div className="bg-primary/50 absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Processing shimmer */}
      {isProcessing && (
        <div className="shimmer absolute inset-x-0 top-0 h-px" />
      )}

      <div className="flex flex-1 flex-col p-5">
        {/* ── Header ── */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex w-full items-start gap-3 pr-8">
            {/* File icon */}
            <div className="bg-primary/10 ring-border relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md ring-1">
              <FileText className="text-primary h-4.5 w-4.5" />
              {isProcessing && (
                <div className="border-background bg-primary absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2">
                  <div className="bg-primary absolute inset-0 animate-ping rounded-full opacity-60" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <Link
                href={`/documents/${document.id}`}
                className="hover:underline"
              >
                <h3 className="text-foreground line-clamp-1 text-sm leading-snug font-semibold">
                  {document.title}
                </h3>
              </Link>
              <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-[11px]">
                <Clock className="h-3 w-3" />
                {formatDate(document.created_at)}
              </div>
            </div>
          </div>

          {/* Status badge and actions */}
          <div className="absolute top-5 right-5 flex shrink-0 items-center gap-2">
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${status.badgeClass}`}
            >
              <StatusIcon
                className={`h-3 w-3 ${status.animate ? "animate-spin" : ""}`}
              />
              {status.label}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  {isDeleting ? (
                    <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                  ) : (
                    <MoreVertical className="text-muted-foreground h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ── Meta strip ── */}
        <div className="text-muted-foreground mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          <span className="flex items-center gap-1">
            <HardDrive className="h-3 w-3" />
            {formatFileSize(document.file_size)}
          </span>
          {document.page_count != null && (
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {document.page_count}{" "}
              {document.page_count === 1 ? "page" : "pages"}
            </span>
          )}
        </div>

        {/* ── Summary ── */}
        {document.summary && (
          <p className="text-muted-foreground mb-4 line-clamp-2 flex-1 text-xs leading-relaxed">
            {document.summary}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* ── Action ── */}
        {isReady ? (
          <Button
            asChild
            size="sm"
            className="group/btn bg-primary text-primary-foreground hover:bg-primary/90 w-full text-xs font-semibold shadow-md shadow-black/10 transition-all hover:scale-[1.01] hover:shadow-black/15"
          >
            <Link href={`/chat/${document.id}`}>
              <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
              Chat with document
              <ArrowRight className="ml-auto h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
            </Link>
          </Button>
        ) : isProcessing ? (
          <Button
            disabled
            size="sm"
            className="text-primary border-primary/20 bg-primary/8 w-full cursor-not-allowed border text-xs opacity-100"
          >
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            Indexing document…
          </Button>
        ) : (
          <Button
            disabled
            size="sm"
            variant="secondary"
            className="w-full text-xs opacity-50"
          >
            {document.status === "error" ? "Processing failed" : "Unavailable"}
          </Button>
        )}
      </div>
    </div>
  );
}
