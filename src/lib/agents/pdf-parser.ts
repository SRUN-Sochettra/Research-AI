// src/lib/agents/pdf-parser.ts
import { AppError } from "@/lib/utils/errors";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require("pdf-parse");

export interface ParsedPDF {
  text: string;
  pageCount: number;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
  };
  pages: string[];
}

export async function parsePDF(buffer: Buffer): Promise<ParsedPDF> {
  try {
    // ✅ Pass buffer in constructor (required)
    const parser = new PDFParse({
      verbosity: 0,
      data: buffer,
    });

    // ✅ Correct API call
    const result = await parser.getText({});

    const pageCount = result.total;

    const pages = result.pages.map((p: { text: string }) =>
      cleanPDFText(p.text)
    );

    const fullText = cleanPDFText(result.text);

    if (!fullText || fullText.length < 50) {
      throw new AppError(
        "PDF appears to be empty or contains no readable text. " +
        "Scanned PDFs without OCR are not supported.",
        "INVALID_PDF_CONTENT",
        400
      );
    }

    return {
      text: fullText,
      pageCount,
      pages,
      metadata: {}, // ✅ this version does not expose metadata via getText()
    };
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw new AppError(
      "Failed to parse PDF. The file may be corrupted or password-protected.",
      "PDF_PARSE_ERROR",
      400,
      error
    );
  }
}

function cleanPDFText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\0/g, "")
    .replace(/([a-z])-\s+([a-z])/g, "$1$2")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}