"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  MessageSquare,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { formatDate, formatFileSize } from "@/lib/utils/helpers";
import type { Document } from "@/types/database";

interface StatusConfigItem {
  label: string;
  icon: React.ElementType;
  variant: "default" | "secondary" | "destructive" | "outline";
  animate?: boolean;
}

const statusConfig: Record<string, StatusConfigItem> = {
  pending: {
    label: "Pending",
    icon: Clock,
    variant: "secondary",
  },
  processing: {
    label: "Processing",
    icon: Loader2,
    variant: "default",
    animate: true,
  },
  completed: {
    label: "Ready",
    icon: CheckCircle2,
    variant: "default",
  },
  failed: {
    label: "Error",
    icon: AlertCircle,
    variant: "destructive",
  },
};

export function DocumentCard({ document }: { document: Document }) {
  const status = statusConfig[document.status] ?? statusConfig["pending"]!;
  const StatusIcon = status.icon;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="line-clamp-1 text-base">
              {document.title}
            </CardTitle>
          </div>
          <Badge variant={status.variant} className="shrink-0">
            <StatusIcon
              className={`mr-1 h-3 w-3 ${"animate" in status && status.animate ? "animate-spin" : ""
                }`}
            />
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>{formatFileSize(document.size)}</p>
          {document.page_count && <p>{document.page_count} pages</p>}
          <p>{formatDate(document.created_at)}</p>
        </div>
        {document.summary && (
          <p className="mt-3 line-clamp-2 text-sm">{document.summary}</p>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        {document.status === "completed" ? (
          <Button asChild className="w-full" size="sm">
            <Link href={`/chat/${document.id}`}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Chat with Document
            </Link>
          </Button>
        ) : (
          <Button disabled className="w-full" size="sm" variant="secondary">
            {document.status === "processing"
              ? "Processing..."
              : "Unavailable"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}