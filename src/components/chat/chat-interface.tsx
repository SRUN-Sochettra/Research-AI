"use client";

import { useEffect, useRef } from "react";
import { useChat } from "@/hooks/use-chat";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { NoMessages } from "@/components/shared/empty-states";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Document, Message } from "@/types/database";
import type { ChatMessage } from "@/hooks/use-chat";

interface ChatInterfaceProps {
  document: Document;
  initialMessages?: Message[];
  initialConversationId?: string;
}

// Convert DB messages to ChatMessage format
function toDisplayMessages(messages: Message[]): ChatMessage[] {
  return messages.map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    content: msg.content,
    citations: msg.citations ?? [],
    latencyMs: msg.latency_ms ?? undefined,
    createdAt: new Date(msg.created_at),
  }));
}

export function ChatInterface({
  document,
  initialMessages = [],
  initialConversationId,
}: ChatInterfaceProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearError,
  } = useChat({
    documentId: document.id,
    initialMessages: toDisplayMessages(initialMessages),
    initialConversationId,
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isDocumentReady = document.status === "ready";

  return (
    <div className="flex h-full flex-col">
      {/* Error banner */}
      {error && (
        <Alert
          variant="destructive"
          className="mx-4 mt-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={clearError}
          >
            <X className="h-3 w-3" />
          </Button>
        </Alert>
      )}

      {/* Messages area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {messages.length === 0 ? (
          <NoMessages />
        ) : (
          <div className="space-y-6">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} className="h-4" />
      </ScrollArea>

      {/* Input area */}
      <div className="border-t bg-background/80 p-4 backdrop-blur">
        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          disabled={!isDocumentReady}
        />

        <p className="mt-2 text-center text-xs text-muted-foreground">
          AI can make mistakes. Always verify important information.
        </p>
      </div>
    </div>
  );
}