import { describe, it, expect, vi } from "vitest";
import { formatConversationHistory } from "@/lib/agents/query-reformulator";
import type { Message } from "@/types/database";

const mockMessages: Message[] = [
    {
        id: "msg-1",
        conversation_id: "conv-1",
        role: "user",
        content: "What is the main topic?",
        citations: [],
        token_usage: null,
        latency_ms: null,
        created_at: new Date().toISOString(),
    },
    {
        id: "msg-2",
        conversation_id: "conv-1",
        role: "assistant",
        content: "The main topic is machine learning.",
        citations: [],
        token_usage: null,
        latency_ms: null,
        created_at: new Date().toISOString(),
    },
];

describe("formatConversationHistory", () => {
    it("formats messages correctly", () => {
        const result = formatConversationHistory(mockMessages);

        expect(result).toContain("Human:");
        expect(result).toContain("Assistant:");
        expect(result).toContain("What is the main topic?");
        expect(result).toContain("machine learning");
    });

    it("returns fallback for empty history", () => {
        const result = formatConversationHistory([]);
        expect(result).toBe("No previous conversation.");
    });

    it("respects maxMessages limit", () => {
        const manyMessages = Array.from({ length: 20 }, (_, i) => ({
            ...mockMessages[0]!,
            id: `msg-${i}`,
            content: `Message ${i}`,
        }));

        const result = formatConversationHistory(manyMessages, 4);
        // Should only include last 4 messages
        expect(result).toContain("Message 16");
        expect(result).toContain("Message 19");
        expect(result).not.toContain("Message 0");
    });

    it("truncates very long messages", () => {
        const longMessage: Message = {
            ...mockMessages[0]!,
            content: "A".repeat(1000),
        };

        const result = formatConversationHistory([longMessage]);
        expect(result.length).toBeLessThan(1000);
        expect(result).toContain("...");
    });
});