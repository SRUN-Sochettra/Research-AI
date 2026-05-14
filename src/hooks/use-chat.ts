"use client";

import { useState, useCallback, useRef } from "react";
import type { Citation } from "@/types/database";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
  isStreaming?: boolean;
  latencyMs?: number;
  createdAt: Date;
}

interface UseChatOptions {
  documentId: string;
  initialMessages?: ChatMessage[];
  initialConversationId?: string;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  conversationId: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearError: () => void;
}

export function useChat({
  documentId,
  initialMessages = [],
  initialConversationId,
}: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId ?? null
  );

  // Track current streaming message ID
  const streamingIdRef = useRef<string | null>(null);
  // Abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      // Cancel any existing stream
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setError(null);
      setIsLoading(true);

      // Optimistically add user message
      const userMessageId = `user-${Date.now()}`;
      const userMessage: ChatMessage = {
        id: userMessageId,
        role: "user",
        content: content.trim(),
        citations: [],
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Add placeholder assistant message for streaming
      const assistantMessageId = `assistant-${Date.now()}`;
      streamingIdRef.current = assistantMessageId;

      const assistantPlaceholder: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        citations: [],
        isStreaming: true,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantPlaceholder]);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content.trim(),
            documentId,
            conversationId,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Request failed: ${response.status}`
          );
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        // Process the SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE events
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? ""; // Keep incomplete chunk

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            try {
              const event = JSON.parse(line.slice(6));
              handleSSEEvent(event, assistantMessageId);
            } catch {
              // Skip malformed events
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Cancelled by user - remove placeholder
          setMessages((prev) =>
            prev.filter((m) => m.id !== assistantMessageId)
          );
          return;
        }

        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to send message";

        setError(errorMessage);

        // Remove streaming placeholder on error
        setMessages((prev) =>
          prev.filter((m) => m.id !== assistantMessageId)
        );
      } finally {
        setIsLoading(false);
        streamingIdRef.current = null;
      }
    },
    [documentId, conversationId, isLoading]
  );

  // Handle individual SSE events
  const handleSSEEvent = useCallback(
    (
      event: Record<string, unknown>,
      assistantMessageId: string
    ) => {
      switch (event.type) {
        case "meta":
          // Set conversation ID from server
          if (event.conversationId) {
            setConversationId(event.conversationId as string);
          }
          break;

        case "token":
          // Append token to streaming message
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                  ...msg,
                  content: msg.content + (event.content as string),
                }
                : msg
            )
          );
          break;

        case "citations":
          // Add citations to the message
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                  ...msg,
                  citations: event.citations as Citation[],
                  latencyMs: event.latencyMs as number,
                }
                : msg
            )
          );
          break;

        case "done":
          // Mark streaming as complete
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                  ...msg,
                  isStreaming: false,
                  // Update ID to match DB record
                  id: (event.messageId as string) || msg.id,
                }
                : msg
            )
          );
          break;

        case "error":
          setError(
            (event.message as string) ||
            "An error occurred"
          );
          // Remove streaming placeholder
          setMessages((prev) =>
            prev.filter((m) => m.id !== assistantMessageId)
          );
          break;
      }
    },
    []
  );

  return {
    messages,
    isLoading,
    error,
    conversationId,
    sendMessage,
    clearError: () => setError(null),
  };
}