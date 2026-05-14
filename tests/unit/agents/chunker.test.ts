import { describe, it, expect } from "vitest";
import { chunkDocument } from "@/lib/agents/chunker";
import type { ParsedPDF } from "@/lib/agents/pdf-parser";

const mockParsed: ParsedPDF = {
    text: "This is a test document. ".repeat(200),
    pageCount: 3,
    pages: [
        "Page one content. ".repeat(50),
        "Page two content. ".repeat(50),
        "Page three content. ".repeat(50),
    ],
    metadata: { title: "Test Doc" },
};

describe("chunkDocument", () => {
    it("should create chunks from a document", async () => {
        const chunks = await chunkDocument(mockParsed, "test-doc-id");

        expect(chunks.length).toBeGreaterThan(0);
        expect(chunks[0]).toHaveProperty("content");
        expect(chunks[0]).toHaveProperty("chunkIndex");
        expect(chunks[0]).toHaveProperty("pageNumber");
        expect(chunks[0]).toHaveProperty("tokenCount");
    });

    it("should assign sequential chunk indices", async () => {
        const chunks = await chunkDocument(mockParsed, "test-doc-id");

        chunks.forEach((chunk, i) => {
            expect(chunk.chunkIndex).toBe(i);
        });
    });

    it("should track page numbers when pages are provided", async () => {
        const chunks = await chunkDocument(mockParsed, "test-doc-id");

        // All chunks should have page numbers since we provided pages
        const chunksWithPages = chunks.filter(
            (c) => c.pageNumber !== null
        );
        expect(chunksWithPages.length).toBeGreaterThan(0);
    });

    it("should estimate token count", async () => {
        const chunks = await chunkDocument(mockParsed, "test-doc-id");

        chunks.forEach((chunk) => {
            expect(chunk.tokenCount).toBeGreaterThan(0);
        });
    });

    it("should not create empty chunks", async () => {
        const chunks = await chunkDocument(mockParsed, "test-doc-id");

        chunks.forEach((chunk) => {
            expect(chunk.content.trim().length).toBeGreaterThan(0);
        });
    });
});