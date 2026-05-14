import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    formatChunksAsContext,
} from "@/lib/agents/retriever";
import type { RetrievedChunk } from "@/lib/agents/retriever";

const mockChunks: RetrievedChunk[] = [
    {
        id: "chunk-1",
        content: "The study found significant improvements in productivity.",
        pageNumber: 3,
        similarity: 0.92,
    },
    {
        id: "chunk-2",
        content: "Key metrics showed a 45% increase in efficiency.",
        pageNumber: 5,
        similarity: 0.85,
    },
];

describe("formatChunksAsContext", () => {
    it("formats chunks with page numbers", () => {
        const result = formatChunksAsContext(mockChunks);

        expect(result).toContain("Source 1");
        expect(result).toContain("Page 3");
        expect(result).toContain("significant improvements");
    });

    it("handles chunks without page numbers", () => {
        const chunksNoPaging: RetrievedChunk[] = [
            { ...mockChunks[0]!, pageNumber: null },
        ];

        const result = formatChunksAsContext(chunksNoPaging);
        expect(result).toContain("Source 1");
        expect(result).not.toContain("Page");
    });

    it("returns fallback message for empty chunks", () => {
        const result = formatChunksAsContext([]);
        expect(result).toContain("No relevant context found");
    });

    it("separates chunks with dividers", () => {
        const result = formatChunksAsContext(mockChunks);
        expect(result).toContain("---");
    });
});