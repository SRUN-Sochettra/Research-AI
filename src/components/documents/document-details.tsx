"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDocumentStatus } from "@/hooks/use-document-status";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
    FileText,
    MessageSquare,
    ArrowLeft,
    Trash2,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Calendar,
    HardDrive,
    BookOpen,
} from "lucide-react";
import { formatDate, formatFileSize } from "@/lib/utils/helpers";
import { toast } from "sonner";
import type { Document, DocumentStatus } from "@/types/database";
import { useState } from "react";

const processingMessages = [
    "Extracting text from PDF...",
    "Splitting into chunks...",
    "Generating AI embeddings...",
    "Saving to vector database...",
    "Creating summary...",
];

export function DocumentDetail({ document }: { document: Document }) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [processingStep, setProcessingStep] = useState(0);

    const { status, summary, pageCount } = useDocumentStatus(
        document.id,
        document.status as DocumentStatus
    );

    const currentStatus = (status ?? document.status) as string;
    const isProcessing =
        currentStatus === "processing" || currentStatus === "uploaded";

    // Cycle through processing messages for UI feedback
    if (isProcessing) {
        setTimeout(() => {
            setProcessingStep((p) => (p + 1) % processingMessages.length);
        }, 3000);
    }

    const handleDelete = async () => {
        if (
            !confirm(
                "Are you sure? This will permanently delete this document and all conversations."
            )
        )
            return;

        setIsDeleting(true);

        try {
            const response = await fetch(`/api/documents/${document.id}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Delete failed");

            toast.success("Document deleted");
            router.push("/documents");
            router.refresh();
        } catch {
            toast.error("Failed to delete document");
            setIsDeleting(false);
        }
    };

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            {/* Back button */}
            <Button variant="ghost" size="sm" asChild>
                <Link href="/documents">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Documents
                </Link>
            </Button>

            {/* Main card */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">{document.title}</CardTitle>
                            </div>
                        </div>

                        <StatusBadge status={currentStatus} />
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Processing state */}
                    {isProcessing && (
                        <div className="space-y-3 rounded-lg bg-muted p-4">
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                <span className="text-sm font-medium">
                                    AI Processing in Progress
                                </span>
                            </div>
                            <Progress value={null} className="h-1" />
                            <p className="text-xs text-muted-foreground">
                                {processingMessages[processingStep]}
                            </p>
                        </div>
                    )}

                    {/* Error state */}
                    {currentStatus === "error" && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Processing failed. The PDF may be corrupted, password-protected,
                                or contain only scanned images without text.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Document metadata */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <MetaItem
                            icon={HardDrive}
                            label="File Size"
                            value={formatFileSize(document.file_size)}
                        />
                        {(pageCount ?? document.page_count) && (
                            <MetaItem
                                icon={BookOpen}
                                label="Pages"
                                value={String(pageCount ?? document.page_count)}
                            />
                        )}
                        <MetaItem
                            icon={Calendar}
                            label="Uploaded"
                            value={formatDate(document.created_at)}
                        />
                    </div>

                    <Separator />

                    {/* Summary */}
                    {(summary ?? document.summary) && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold">AI Summary</h3>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                {summary ?? document.summary}
                            </p>
                        </div>
                    )}

                    {currentStatus === "ready" && !summary && !document.summary && (
                        <div className="text-sm text-muted-foreground">
                            Summary generation in progress...
                        </div>
                    )}

                    <Separator />

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Delete Document
                        </Button>

                        {currentStatus === "ready" && (
                            <Button asChild>
                                <Link href={`/chat/${document.id}`}>
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Start Chatting
                                </Link>
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function MetaItem({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium">{value}</p>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config = {
        uploaded: { label: "Uploaded", variant: "secondary" as const },
        processing: { label: "Processing", variant: "default" as const },
        ready: { label: "Ready", variant: "default" as const },
        error: { label: "Error", variant: "destructive" as const },
    };

    const current = config[status as keyof typeof config] ?? config.uploaded;

    return (
        <Badge variant={current.variant}>
            {status === "processing" && (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            )}
            {status === "ready" && (
                <CheckCircle2 className="mr-1 h-3 w-3" />
            )}
            {current.label}
        </Badge>
    );
}