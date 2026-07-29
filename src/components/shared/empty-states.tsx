import { FileText, MessageSquare, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-5 p-8 text-center">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 ring-1 ring-white/10">
        {icon || <FileText className="h-10 w-10 text-violet-400" />}
        {/* Glow */}
        <div className="absolute inset-0 rounded-2xl bg-violet-500/10 blur-xl" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
      </div>
      {action &&
        (action.href ? (
          <Button
            asChild
            className="bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-700 hover:to-blue-700"
          >
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button
            onClick={action.onClick}
            className="bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-700 hover:to-blue-700"
          >
            {action.label}
          </Button>
        ))}
    </div>
  );
}

export function NoDocuments() {
  return (
    <EmptyState
      icon={<Upload className="h-10 w-10 text-violet-400" />}
      title="No documents yet"
      description="Upload a PDF to get started. Our AI will analyze it and let you ask questions."
      action={{
        label: "Upload your first PDF",
        href: "/documents?upload=true",
      }}
    />
  );
}

export function NoMessages() {
  return (
    <EmptyState
      icon={<MessageSquare className="h-10 w-10 text-blue-400" />}
      title="Start a conversation"
      description="Ask a question about this document and our AI will find the answers with citations."
    />
  );
}
