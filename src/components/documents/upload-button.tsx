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
import { Upload, FileUp, Loader2, CheckCircle2, X, Sparkles } from "lucide-react";
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
            await response.json();
            setProgress(100);
            setState("done");

            toast.success("Document uploaded! AI processing started.");

            setTimeout(() => {
                setOpen(false);
                resetState();
                router.refresh();
            }, 1500);
        } catch (err) {
            setState("selected");
            setProgress(0);
            toast.error(err instanceof Error ? err.message : "Failed to upload");
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (!isOpen) resetState();
            }}
        >
            <DialogTrigger asChild>
                <Button className="group bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/20 hover:from-violet-700 hover:to-blue-700 hover:shadow-violet-500/30">
                    <Upload className="mr-2 h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                    Upload PDF
                </Button>
            </DialogTrigger>

            <DialogContent className="glass border-white/10 sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-violet-400" />
                        Upload Document
                    </DialogTitle>
                    <DialogDescription>
                        Upload a PDF to analyze with AI. Max{" "}
                        {formatFileSize(LIMITS.maxFileSize)}.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Drop zone */}
                    <div
                        className={`relative flex min-h-50 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all duration-200 ${state === "idle"
                                ? "border-white/10 hover:border-violet-500/40 hover:bg-violet-500/5"
                                : state === "done"
                                    ? "border-emerald-500/40 bg-emerald-500/5"
                                    : "border-violet-500/40 bg-violet-500/5"
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
                            <div className="text-center">
                                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
                                    <FileUp className="h-7 w-7 text-violet-400" />
                                </div>
                                <p className="text-sm font-medium">Click to select a PDF</p>
                                <p className="mt-1 text-xs text-muted-foreground">or drag and drop</p>
                            </div>
                        )}

                        {state === "selected" && file && (
                            <div className="text-center">
                                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/30">
                                    <FileUp className="h-7 w-7 text-violet-400" />
                                </div>
                                <p className="text-sm font-semibold">{file.name}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {formatFileSize(file.size)}
                                </p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-2 h-7 text-xs"
                                    onClick={(e) => { e.stopPropagation(); resetState(); }}
                                >
                                    <X className="mr-1 h-3 w-3" /> Remove
                                </Button>
                            </div>
                        )}

                        {(state === "uploading" || state === "processing") && (
                            <div className="text-center">
                                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/30">
                                    <Loader2 className="h-7 w-7 animate-spin text-blue-400" />
                                </div>
                                <p className="text-sm font-medium">
                                    {state === "uploading" ? "Uploading..." : "Processing with AI..."}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {state === "processing" && "This may take a minute"}
                                </p>
                            </div>
                        )}

                        {state === "done" && (
                            <div className="text-center">
                                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
                                    <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                                </div>
                                <p className="text-sm font-semibold text-emerald-400">
                                    Upload complete!
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Progress */}
                    {(state === "uploading" || state === "processing" || state === "done") && (
                        <div className="space-y-1">
                            <Progress value={progress} className="h-1.5" />
                            <p className="text-right text-xs text-muted-foreground">{progress}%</p>
                        </div>
                    )}

                    {/* CTA */}
                    {state === "selected" && (
                        <Button
                            onClick={handleUpload}
                            className="w-full bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-700 hover:to-blue-700"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload & Analyze
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}