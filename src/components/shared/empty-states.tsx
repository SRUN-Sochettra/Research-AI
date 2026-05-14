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
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-muted p-4">
        {icon || <FileText className="h-8 w-8 text-muted-foreground" />}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-sm text-muted-foreground">{description}</p>
      {action &&
        (action.href ? (
          <Button asChild>
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button onClick={action.onClick}>{action.label}</Button>
        ))}
    </div>
  );
}

export function NoDocuments() {
  return (
    <EmptyState
      icon={<Upload className="h-8 w-8 text-muted-foreground" />}
      title="No documents yet"
      description="Upload a PDF to get started. Our AI will analyze it and let you ask questions."
      action={{ label: "Upload PDF", href: "/documents?upload=true" }}
    />
  );
}

export function NoMessages() {
  return (
    <EmptyState
      icon={<MessageSquare className="h-8 w-8 text-muted-foreground" />}
      title="Start a conversation"
      description="Ask a question about this document and our AI will find the answers."
    />
  );
}