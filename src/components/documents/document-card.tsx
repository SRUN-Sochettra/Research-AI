"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    badgeClass: "border-blue-500/20 bg-blue-500/8 text-blue-400",
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
  const status = statusConfig[document.status] ?? statusConfig["uploaded"]!;
  const StatusIcon = status.icon;
  const isReady = document.status === "ready";
  const isProcessing = document.status === "processing";

  return (
    <div className="card-interactive group relative flex flex-col overflow-hidden rounded-2xl border border-white/7 bg-white/[0.02] transition-all duration-300 hover:border-white/12 hover:bg-white/[0.03]">

      {/* Top gradient accent — visible on hover */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Processing shimmer */}
      {isProcessing && (
        <div className="absolute inset-x-0 top-0 h-px shimmer" />
      )}

      <div className="flex flex-1 flex-col p-5">

        {/* ── Header ── */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* File icon */}
            <div className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/15 to-blue-600/10 ring-1 ring-white/8">
              <FileText className="h-4.5 w-4.5 text-violet-400" />
              {isProcessing && (
                <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-blue-400">
                  <div className="absolute inset-0 rounded-full bg-blue-400 opacity-60 animate-ping" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <h3 className="line-clamp-1 text-sm font-semibold leading-snug text-foreground">
                {document.title}
              </h3>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDate(document.created_at)}
              </div>
            </div>
          </div>

          {/* Status badge */}
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${status.badgeClass}`}
          >
            <StatusIcon
              className={`h-3 w-3 ${status.animate ? "animate-spin" : ""}`}
            />
            {status.label}
          </span>
        </div>

        {/* ── Meta strip ── */}
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <HardDrive className="h-3 w-3" />
            {formatFileSize(document.file_size)}
          </span>
          {document.page_count != null && (
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {document.page_count} {document.page_count === 1 ? "page" : "pages"}
            </span>
          )}
        </div>

        {/* ── Summary ── */}
        {document.summary && (
          <p className="mb-4 line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">
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
            className="group/btn w-full bg-gradient-to-r from-violet-600 to-blue-600 text-xs font-semibold text-white shadow-md shadow-violet-500/15 transition-all hover:shadow-violet-500/30 hover:scale-[1.01]"
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
            className="w-full cursor-not-allowed border border-blue-500/20 bg-blue-500/8 text-xs text-blue-400 opacity-100"
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