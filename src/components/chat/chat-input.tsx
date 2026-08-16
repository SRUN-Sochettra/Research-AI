"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, StopCircle } from "lucide-react";
import { cn } from "@/lib/utils/helpers";
import { LIMITS } from "@/lib/utils/constants";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "Summarize the main points of this document",
  "What are the key findings?",
  "What conclusions does the author draw?",
  "List the most important facts mentioned",
];

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isLoading || disabled) return;

    onSend(trimmed);
    setValue("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, isLoading, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (not Shift+Enter)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  const charsRemaining = LIMITS.maxMessageLength - value.length;
  const isNearLimit = charsRemaining < 200;

  return (
    <div className="space-y-3">
      {/* Suggested questions (only when empty) */}
      {value === "" && !isLoading && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => {
                setValue(q);
                textareaRef.current?.focus();
              }}
              className="bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-full border px-3 py-1 text-xs transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="bg-background focus-within:ring-ring relative flex items-end gap-2 rounded-md border p-2 shadow-sm focus-within:ring-1">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? "Document is still processing..."
              : "Ask a question about this document..."
          }
          disabled={disabled || isLoading}
          maxLength={LIMITS.maxMessageLength}
          rows={1}
          className={cn(
            "min-h-[44px] flex-1 resize-none border-0 bg-transparent",
            "p-2 text-sm shadow-none focus-visible:ring-0",
            "scrollbar-thin"
          )}
          aria-label="Message input"
          aria-describedby="chat-input-hint"
        />

        {/* Send button */}
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading || disabled}
          className="h-9 w-9 shrink-0 rounded-lg"
          aria-label={isLoading ? "Cancel response" : "Send message"}
        >
          {isLoading ? (
            <StopCircle className="h-4 w-4" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      <p id="chat-input-hint" className="sr-only">
        Press Enter to send, Shift+Enter for new line
      </p>

      {/* Char counter */}
      {isNearLimit && (
        <p
          className={cn(
            "text-right text-xs",
            charsRemaining < 50 ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {charsRemaining} characters remaining
        </p>
      )}
    </div>
  );
}
