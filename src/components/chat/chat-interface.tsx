"use client";

import { useEffect, useRef } from "react";
import { useChat } from "@/hooks/use-chat";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { NoMessages } from "@/components/shared/empty-states";
import { AlertTriangle, X, Brain, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Document, Message, Citation } from "@/types/database";
import type { ChatMessage } from "@/hooks/use-chat";

interface ChatInterfaceProps {
  document: Document;
  documentIds?: string[];
  initialMessages?: Message[];
  initialConversationId?: string;
}

function toDisplayMessages(messages: Message[]): ChatMessage[] {
  return messages.map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    content: msg.content,
    citations: (msg.citations as unknown as Citation[]) ?? [],
    latencyMs: msg.latency_ms ?? undefined,
    createdAt: msg.created_at ? new Date(msg.created_at) : new Date(),
  }));
}

export function ChatInterface({
  document,
  documentIds,
  initialMessages = [],
  initialConversationId,
}: ChatInterfaceProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, error, sendMessage, clearError } = useChat({
    documentId: documentIds && documentIds.length > 0 ? undefined : document.id,
    documentIds:
      documentIds && documentIds.length > 0 ? documentIds : undefined,
    initialMessages: toDisplayMessages(initialMessages),
    initialConversationId,
  });

  const handleExport = () => {
    if (messages.length === 0) return;

    let markdown = `# Conversation about ${document.title}\n\n`;
    markdown += `*Generated on ${new Date().toLocaleString()}*\n\n---\n\n`;

    messages.forEach((msg) => {
      const role = msg.role === "user" ? "**You:**" : "**Assistant:**";
      markdown += `${role}\n\n${msg.content}\n\n`;

      if (msg.citations && msg.citations.length > 0) {
        markdown += `*Sources:*\n`;
        msg.citations.forEach((citation, idx) => {
          markdown += `- [${idx + 1}] Page ${citation.pageNumber || "N/A"}\n`;
        });
        markdown += `\n`;
      }

      markdown += `---\n\n`;
    });

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `${document.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}-conversation.md`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isDocumentReady = document.status === "ready";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md border border-white/7 bg-white/[0.015]">
      {/* ── Doc header bar ── */}
      <div className="flex items-center gap-3 border-b border-white/6 px-5 py-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600/20 to-blue-600/10 ring-1 ring-white/8">
          <Brain className="text-primary h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{document.title}</p>
          <p className="text-muted-foreground text-[11px]">
            {messages.length > 0
              ? `${messages.filter((m) => m.role === "user").length} question${messages.filter((m) => m.role === "user").length === 1 ? "" : "s"} asked`
              : "Ask anything about this document"}
          </p>
        </div>

        {/* Status dot */}
        <div className="text-muted-foreground ml-auto flex items-center gap-1.5 text-[11px]">
          <span
            className={`status-dot ${isDocumentReady ? "status-online" : "status-warning"}`}
          />
          {isDocumentReady ? "Ready" : "Processing"}
        </div>

        {/* Export Button */}
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground ml-2 h-7 w-7"
            onClick={handleExport}
            title="Export conversation as Markdown"
          >
            <Download className="h-4 w-4" />
            <span className="sr-only">Export conversation</span>
          </Button>
        )}
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="mx-4 mt-3">
          <Alert className="flex items-center justify-between border-red-500/20 bg-red-500/8 py-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-xs text-red-400">
                {error}
              </AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              onClick={clearError}
            >
              <X className="h-3 w-3" />
            </Button>
          </Alert>
        </div>
      )}

      {/* ── Messages ── */}
      <ScrollArea className="flex-1 scrollbar-thin" ref={scrollAreaRef}>
        <div className="px-4 py-5">
          {messages.length === 0 ? (
            <NoMessages />
          ) : (
            <div className="space-y-5">
              {messages.map((message, i) => (
                <div
                  key={message.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <MessageBubble message={message} />
                </div>
              ))}
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600/20 to-blue-600/10 ring-1 ring-white/8">
                <Brain className="text-primary h-4 w-4" />
              </div>
              <div className="flex items-center gap-1 rounded-md rounded-tl-sm border border-white/7 bg-white/[0.03] px-4 py-3">
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-violet-400 opacity-70"
                      style={{
                        animation: "bounce 1.2s ease-in-out infinite",
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </span>
                <span className="text-muted-foreground ml-2 text-xs">
                  Thinking…
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} className="h-2" />
        </div>
      </ScrollArea>

      {/* ── Input area ── */}
      <div className="bg-background/40 border-t border-white/6 px-4 py-3 backdrop-blur-sm">
        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          disabled={!isDocumentReady}
        />
        <p className="text-muted-foreground/60 mt-2 text-center text-[10px]">
          AI can make mistakes — always verify important information with the
          source
        </p>
      </div>
    </div>
  );
}
