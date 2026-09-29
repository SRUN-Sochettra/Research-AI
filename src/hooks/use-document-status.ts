"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DocumentStatus } from "@/types/database";

interface DocumentStatusState {
  status: DocumentStatus | null;
  summary: string | null;
  pageCount: number | null;
  isLoading: boolean;
  error: string | null;
}

export function useDocumentStatus(
  documentId: string,
  initialStatus: DocumentStatus
) {
  const [state, setState] = useState<DocumentStatusState>({
    status: initialStatus,
    summary: null,
    pageCount: null,
    isLoading: initialStatus !== "ready" && initialStatus !== "error",
    error: null,
  });
  const stoppedRef = useRef(false);

  const poll = useCallback(async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/status`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Failed to fetch status");

      const data = await response.json();
      const nextStatus = data.status as DocumentStatus;
      setState({
        status: nextStatus,
        summary: data.summary,
        pageCount: data.pageCount,
        isLoading: false,
        error: null,
      });
      return nextStatus;
    } catch {
      setState((previous) => ({
        ...previous,
        isLoading: false,
        error: "Failed to check status",
      }));
      return null;
    }
  }, [documentId]);

  useEffect(() => {
    stoppedRef.current = false;

    if (initialStatus === "ready" || initialStatus === "error") return;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    const maxAttempts = 60;

    const schedulePoll = async () => {
      if (stoppedRef.current) return;
      attempts += 1;
      const currentStatus = await poll();
      if (
        stoppedRef.current ||
        currentStatus === "ready" ||
        currentStatus === "error" ||
        attempts >= maxAttempts
      ) {
        return;
      }
      timeoutId = setTimeout(schedulePoll, 5000);
    };

    void schedulePoll();

    const checkWhenVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };
    document.addEventListener("visibilitychange", checkWhenVisible);

    return () => {
      stoppedRef.current = true;
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", checkWhenVisible);
    };
  }, [documentId, initialStatus, poll]);

  return state;
}
