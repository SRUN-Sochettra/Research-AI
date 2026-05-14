"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Upload, FileUp, Loader2, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { formatFileSize } from "@/lib/utils/helpers";
import { LIMITS } from "@/lib/utils/constants";

type UploadState = "idle" | "selected" | "uploading" | "processing" | "done";

export function UploadButton() {
    const [state, setState] = useState<UploadState>("idle");
    const [file, setFile] = useState<File | null>(null);
    const [progress, setProgress] = useState(0);
    const [open, setOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const resetState = () => {
        setState("idle");
        setFile(null);
        setProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;

        if (selected.type !== "application/pdf") {
            toast.error("Only PDF files are supported");
            return;
        }

        if (selected.size > LIMITS.maxFileSize) {
            toast.error("File must be less than 10MB");
            return;
        }

        setFile(selected);
        setState("selected");
    };

    const handleUpload = async () => {
        if (!file) return;

        try {
            setState("uploading");
            setProgress(20);

            const formData = new FormData();
            formData.append("file", file);

            setProgress(40);

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            setProgress(60);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || "Upload failed");
            }

            setState("processing");
            setProgress(80);

            const data = await response.json();

            setProgress(100);
            setState("done");

            toast.success("Document uploaded successfully!");

            // Close dialog and refresh after short delay
            setTimeout(() => {
                setOpen(false);
                resetState();
                router.refresh();
            }, 1500);
        } catch (err) {
            setState("selected");
            setProgress(0);
            toast.error(
                err instanceof Error ? err.message : "Failed to upload document"
            );
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetState();
        }}>
            <DialogTrigger asChild>
                <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload PDF
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                    <DialogDescription>
                        Upload a PDF file to analyze with AI. Max {formatFileSize(LIMITS.maxFileSize)}.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Drop zone */}
                    <div
                        className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${state === "idle"
                                ? "border-muted-foreground/25 hover:border-muted-foreground/50"
                                : "border-primary/50 bg-primary/5"
                            }`}
                        onClick={() => state === "idle" && fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={handleFileSelect}
                            disabled={state !== "idle"}
                        />

                        {state === "idle" && (
                            <>
                                <FileUp className="mb-3 h-10 w-10 text-muted-foreground" />
                                <p className="text-sm font-medium">Click to select a PDF</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    or drag and drop
                                </p>
                            </>
                        )}

                        {state === "selected" && file && (
                            <div className="text-center">
                                <FileUp className="mx-auto mb-3 h-10 w-10 text-primary" />
                                <p className="text-sm font-medium">{file.name}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {formatFileSize(file.size)}
                                </p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        resetState();
                                    }}
                                >
                                    <X className="mr-1 h-3 w-3" /> Remove
                                </Button>
                            </div>
                        )}

                        {(state === "uploading" || state === "processing") && (
                            <div className="text-center">
                                <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-primary" />
                                <p className="text-sm font-medium">
                                    {state === "uploading"
                                        ? "Uploading..."
                                        : "Processing with AI..."}
                                </p>
                            </div>
                        )}

                        {state === "done" && (
                            <div className="text-center">
                                <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-500" />
                                <p className="text-sm font-medium">Done!</p>
                            </div>
                        )}
                    </div>

                    {/* Progress bar */}
                    {(state === "uploading" || state === "processing" || state === "done") && (
                        <Progress value={progress} className="h-2" />
                    )}

                    {/* Upload button */}
                    {state === "selected" && (
                        <Button onClick={handleUpload} className="w-full">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload & Analyze
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}