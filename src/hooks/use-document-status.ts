"use client";

import { useEffect, useState, useCallback } from "react";
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
        isLoading: false,
        error: null,
    });

    const poll = useCallback(async () => {
        try {
            const response = await fetch(
                `/api/documents/${documentId}/status`
            );

            if (!response.ok) {
                throw new Error("Failed to fetch status");
            }

            const data = await response.json();
            setState((prev) => ({
                ...prev,
                status: data.status,
                summary: data.summary,
                pageCount: data.pageCount,
                isLoading: false,
            }));

            return data.status as DocumentStatus;
        } catch {
            setState((prev) => ({
                ...prev,
                error: "Failed to check status",
                isLoading: false,
            }));
            return null;
        }
    }, [documentId]);

    useEffect(() => {
        // Only poll if document is in a processing state
        if (
            initialStatus === "completed" ||
            initialStatus === "failed"
        ) {
            return;
        }

        let intervalId: NodeJS.Timeout;
        let attempts = 0;
        const MAX_ATTEMPTS = 30; // 5 minutes max polling

        const startPolling = async () => {
            setState((prev) => ({ ...prev, isLoading: true }));

            intervalId = setInterval(async () => {
                attempts++;
                const currentStatus = await poll();

                // Stop polling when done or errored
                if (
                    currentStatus === "completed" ||
                    currentStatus === "failed" ||
                    attempts >= MAX_ATTEMPTS
                ) {
                    clearInterval(intervalId);
                }
            }, 10000); // Poll every 10 seconds
        };

        startPolling();

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [documentId, initialStatus, poll]);

    return state;
}