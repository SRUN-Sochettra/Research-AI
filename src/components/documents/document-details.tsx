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
import { Input } from "@/components/ui/input";
import {
    FileText,
    MessageSquare,
    ArrowLeft,
    Pencil,
    X,
    Check,
    Trash2,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Calendar,
    HardDrive,
    BookOpen,
    Download,
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
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState(document.title);
    const [isSavingTitle, setIsSavingTitle] = useState(false);

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


    const handleSaveTitle = async () => {
        if (!title.trim() || title === document.title) {
            setIsEditingTitle(false);
            setTitle(document.title);
            return;
        }

        setIsSavingTitle(true);
        try {
            const response = await fetch(`/api/documents/${document.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: title.trim() }),
            });

            if (!response.ok) throw new Error("Failed to update title");

            toast.success("Document title updated");
            setIsEditingTitle(false);
            router.refresh();
        } catch {
            toast.error("Failed to update document title");
            setTitle(document.title);
        } finally {
            setIsSavingTitle(false);
        }
    };

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
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                                {isEditingTitle ? (
                                    <div className="flex items-center gap-2 w-full max-w-sm">
                                        <Input
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="h-8"
                                            disabled={isSavingTitle}
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveTitle();
                                                if (e.key === 'Escape') {
                                                    setTitle(document.title);
                                                    setIsEditingTitle(false);
                                                }
                                            }}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                                            onClick={handleSaveTitle}
                                            disabled={isSavingTitle || !title.trim() || title === document.title}
                                        >
                                            {isSavingTitle ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            onClick={() => {
                                                setTitle(document.title);
                                                setIsEditingTitle(false);
                                            }}
                                            disabled={isSavingTitle}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingTitle(true)}>
                                        <CardTitle className="text-xl truncate">{document.title}</CardTitle>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Pencil className="h-3 w-3 text-muted-foreground" />
                                        </Button>
                                    </div>
                                )}
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

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <a href={`/api/documents/${document.id}/download`}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Original PDF
                                </a>
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