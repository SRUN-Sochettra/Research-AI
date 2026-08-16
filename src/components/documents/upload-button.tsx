"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  Upload,
  FileUp,
  Loader2,
  CheckCircle2,
  X,
  ScanSearch,
} from "lucide-react";
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
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("upload") === "true") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(true);
      router.replace("/documents");
    }
  }, [searchParams, router]);

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
        <Button className="group bg-primary hover:bg-primary/90 text-white shadow-lg shadow-black/15 hover:shadow-black/15">
          <Upload className="mr-2 h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
          Upload PDF
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanSearch className="text-primary h-4 w-4" />
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
            className={`relative flex min-h-50 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-6 transition-all duration-200 ${
              state === "idle"
                ? "hover:border-primary/40 border-border hover:bg-primary/5"
                : state === "done"
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-primary/40 bg-primary/5"
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
                <div className="bg-primary/10 ring-primary/20 mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-md ring-1">
                  <FileUp className="text-primary h-7 w-7" />
                </div>
                <p className="text-sm font-medium">Click to select a PDF</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  or drag and drop
                </p>
              </div>
            )}

            {state === "selected" && file && (
              <div className="text-center">
                <div className="bg-primary/10 ring-primary/30 mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-md ring-1">
                  <FileUp className="text-primary h-7 w-7" />
                </div>
                <p className="text-sm font-semibold">{file.name}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {formatFileSize(file.size)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 text-xs"
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
                <div className="bg-primary/10 ring-primary/30 mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-md ring-1">
                  <Loader2 className="text-primary h-7 w-7 animate-spin" />
                </div>
                <p className="text-sm font-medium">
                  {state === "uploading"
                    ? "Uploading..."
                    : "Processing with AI..."}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {state === "processing" && "This may take a minute"}
                </p>
              </div>
            )}

            {state === "done" && (
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-md bg-emerald-500/10 ring-1 ring-emerald-500/30">
                  <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-emerald-400">
                  Upload complete!
                </p>
              </div>
            )}
          </div>

          {/* Progress */}
          {(state === "uploading" ||
            state === "processing" ||
            state === "done") && (
            <div className="space-y-1">
              <Progress value={progress} className="h-1.5" />
              <p className="text-muted-foreground text-right text-xs">
                {progress}%
              </p>
            </div>
          )}

          {/* CTA */}
          {state === "selected" && (
            <Button
              onClick={handleUpload}
              className="bg-primary hover:bg-primary/90 w-full text-white"
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
