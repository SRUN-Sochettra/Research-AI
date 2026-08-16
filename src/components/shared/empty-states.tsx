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
      <div className="bg-primary/10 ring-border relative flex h-20 w-20 items-center justify-center rounded-md ring-1">
        {icon || <FileText className="text-primary h-10 w-10" />}
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
      </div>
      {action &&
        (action.href ? (
          <Button asChild className="bg-primary hover:bg-primary/90 text-white">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button
            onClick={action.onClick}
            className="bg-primary hover:bg-primary/90 text-white"
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
      icon={<Upload className="text-primary h-10 w-10" />}
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
      icon={<MessageSquare className="text-primary h-10 w-10" />}
      title="Start a conversation"
      description="Ask a question about this document and our AI will find the answers with citations."
    />
  );
}
