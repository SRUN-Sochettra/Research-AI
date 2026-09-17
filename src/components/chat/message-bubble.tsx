"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/helpers";
import { CitationCard } from "./citation-card";
import { Button } from "@/components/ui/button";
import {
  Network,
  User,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Check,
} from "lucide-react";
import type { ChatMessage } from "@/hooks/use-chat";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [showCitations, setShowCitations] = useState(false);
  const isUser = message.role === "user";
  const hasCitations = message.citations.length > 0;
  const [hasCopied, setHasCopied] = useState(false);
  const copyResetTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetTimer.current !== null) {
        window.clearTimeout(copyResetTimer.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setHasCopied(true);
      if (copyResetTimer.current !== null) {
        window.clearTimeout(copyResetTimer.current);
      }
      copyResetTimer.current = window.setTimeout(
        () => setHasCopied(false),
        2000
      );
    } catch {
      setHasCopied(false);
    }
  };

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Network className="h-4 w-4" />
        )}
      </div>

      {/* Message content */}
      <div
        className={cn(
          "flex max-w-[75%] flex-col gap-2",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* Bubble */}
        <div
          className={cn(
            "rounded-md px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted text-foreground rounded-tl-sm"
          )}
        >
          {message.isStreaming && message.content === "" ? (
            <TypingIndicator />
          ) : (
            <MessageContent content={message.content} />
          )}

          {/* Streaming cursor */}
          {message.isStreaming && message.content !== "" && (
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-current align-middle" />
          )}
        </div>

        {/* Footer: citations toggle + latency */}
        {!isUser && !message.isStreaming && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground h-6 w-6"
              onClick={handleCopy}
              title="Copy to clipboard"
            >
              {hasCopied ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              <span className="sr-only">Copy message</span>
            </Button>
            {hasCitations && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-6 px-2 text-xs"
                onClick={() => setShowCitations((prev) => !prev)}
              >
                {showCitations ? (
                  <ChevronUp className="mr-1 h-3 w-3" />
                ) : (
                  <ChevronDown className="mr-1 h-3 w-3" />
                )}
                {message.citations.length} source
                {message.citations.length !== 1 ? "s" : ""}
              </Button>
            )}

            {message.latencyMs && (
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Clock className="h-3 w-3" />
                {(message.latencyMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        )}

        {/* Citations */}
        {showCitations && hasCitations && (
          <div className="flex w-full flex-col gap-2">
            {message.citations.map((citation, idx) => (
              <CitationCard
                key={citation.chunk_id}
                citation={citation}
                index={idx + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Renders a constrained, safe subset of Markdown without injecting HTML.
function BoldText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={index}>{part.slice(2, -2)}</strong>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        )
      )}
    </>
  );
}

function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (line === "") return <br key={i} />;

        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <div key={i} className="flex gap-2">
              <span className="mt-0.5 shrink-0" aria-hidden="true">
                •
              </span>
              <span>
                <BoldText text={line.slice(2)} />
              </span>
            </div>
          );
        }

        const numbered = line.match(/^(\d+)\.\s(.*)$/);
        if (numbered) {
          return (
            <div key={i} className="flex gap-2">
              <span className="shrink-0 font-medium">{numbered[1]}.</span>
              <span>
                <BoldText text={numbered[2] ?? ""} />
              </span>
            </div>
          );
        }

        return (
          <p key={i}>
            <BoldText text={line} />
          </p>
        );
      })}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-2 w-2 animate-bounce rounded-full bg-current opacity-60"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}
