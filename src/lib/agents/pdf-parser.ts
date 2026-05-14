import * as pdf from "pdf-parse";
// @ts-ignore - pdf-parse has tricky types
const pdfParser = pdf.default || pdf;

import { AppError } from "@/lib/utils/errors";

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
  // Text per page for accurate page citations
  pages: string[];
}

export async function parsePDF(buffer: Buffer): Promise<ParsedPDF> {
  try {
    // Track text per page for citation accuracy
    const pages: string[] = [];
    let pageCount = 0;

    // @ts-ignore
    const data = await pdfParser(buffer, {
      // Called for each page during parsing
      pagerender: function (pageData: { getTextContent: () => Promise<{ items: { str: string; transform: number[] }[] }> }) {
        return pageData.getTextContent().then(function (textContent: { items: { str: string; transform: number[] }[] }) {
          let pageText = "";
          let lastY: number | null = null;

          for (const item of textContent.items) {
            const textItem = item as {
              str: string;
              transform: number[];
            };
            const currentY = textItem.transform[5];

            if (currentY === undefined) continue;

            // Add newline when Y position changes significantly
            if (lastY !== null && Math.abs(currentY - lastY) > 5) {
              pageText += "\n";
            }

            pageText += textItem.str;
            lastY = currentY ?? null;
          }

          pages.push(pageText.trim());
          return pageText;
        });
      },
    });

    pageCount = data.numpages;

    // If pagerender didn't capture pages correctly, use full text
    if (pages.length === 0) {
      pages.push(data.text);
    }

    // Clean up the text
    const cleanText = cleanPDFText(data.text);

    if (!cleanText || cleanText.trim().length < 50) {
      throw new AppError(
        "PDF appears to be empty or contains no readable text. " +
        "Scanned PDFs without OCR are not supported.",
        "INVALID_PDF_CONTENT",
        400
      );
    }

    return {
      text: cleanText,
      pageCount,
      pages: pages.map(cleanPDFText),
      metadata: {
        title: data.info?.Title || undefined,
        author: data.info?.Author || undefined,
        subject: data.info?.Subject || undefined,
        creator: data.info?.Creator || undefined,
        producer: data.info?.Producer || undefined,
      },
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
    // Remove excessive whitespace
    .replace(/\s+/g, " ")
    // Remove null bytes
    .replace(/\0/g, "")
    // Fix common PDF extraction artifacts
    .replace(/([a-z])-\s+([a-z])/g, "$1$2") // dehyphenate
    // Normalize line endings
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Remove excessive newlines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}