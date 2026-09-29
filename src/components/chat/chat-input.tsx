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
  documentTitle: string;
  /** Show starter prompts only while the active conversation is empty. */
  showSuggestions: boolean;
}

/**
 * Labels stay short so the chip row cannot dominate a small viewport, while the
 * question actually sent stays grounded in the active document's title.
 */
const SUGGESTED_QUESTIONS = [
  {
    label: "Create a five-point study guide",
    build: (title: string) => `Create a five-point study guide for “${title}”.`,
  },
  {
    label: "Explain the most important concepts",
    build: (title: string) =>
      `Explain the most important concepts in “${title}”.`,
  },
  {
    label: "Simplify the difficult sections",
    build: (title: string) =>
      `Simplify the difficult sections of “${title}” in simple terms.`,
  },
  {
    label: "Quiz me and cite the relevant pages",
    build: (title: string) =>
      `Quiz me on “${title}” and cite the relevant pages.`,
  },
];

export function ChatInput({
  onSend,
  isLoading,
  disabled,
  documentTitle,
  showSuggestions,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestedQuestions = SUGGESTED_QUESTIONS.map((s) => ({
    ...s,
    question: s.build(documentTitle),
  }));

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
      {/* Suggested questions — empty conversation only.
          On narrow screens the chips become a single swipeable row so they can
          never grow tall enough to squeeze the message history to zero height. */}
      {showSuggestions && !isLoading && (
        <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-x-visible sm:px-0 sm:pb-0">
          {suggestedQuestions.map(({ label, question }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setValue(question);
                textareaRef.current?.focus();
              }}
              title={question}
              className="bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground max-w-[80vw] shrink-0 snap-start truncate rounded-full border px-3 py-1 text-xs whitespace-nowrap transition-colors sm:max-w-full"
            >
              {label}
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
