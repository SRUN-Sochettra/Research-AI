// src/lib/agents/pdf-parser.ts
import { AppError } from "@/lib/utils/errors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AI_CONFIG } from "@/lib/utils/constants";

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
    // Pass buffer in constructor (required)
    const parser = new PDFParse({
      verbosity: 0,
      data: buffer,
    });

    const result = await parser.getText({});

    const pageCount = result.total;

    const pages = result.pages.map((p: { text: string }) =>
      cleanPDFText(p.text)
    );

    const fullText = cleanPDFText(result.text);

    // No usable text layer → try the OCR fallback (image-only / scanned PDF).
    if (!fullText || fullText.length < 50) {
      try {
        const ocrText = await extractTextWithGemini(buffer);
        const cleanOcrText = cleanPDFText(ocrText);
        if (!cleanOcrText || cleanOcrText.length < 50) {
          throw new AppError("Invalid PDF", "INVALID_PDF_CONTENT", 400);
        }
        return {
          text: cleanOcrText,
          pageCount: pageCount > 0 ? pageCount : 1,
          pages: [cleanOcrText],
          metadata: {},
        };
      } catch (ocrError) {
        if (ocrError instanceof AppError) throw ocrError;
        throw new AppError("PDF empty", "INVALID_PDF_CONTENT", 400);
      }
    }

    return {
      text: fullText,
      pageCount,
      pages,
      metadata: {}, // this version does not expose metadata via getText()
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

// OCR fallback for PDFs with no extractable text layer.
//
// NOTE: This is best-effort. It uses the Gemini multimodal model
// (AI_CONFIG.ocrModel) to read the document. The previous Google Cloud Vision
// path was removed because it constructed an ImageAnnotatorClient with no
// credentials configured (no GOOGLE_APPLICATION_CREDENTIALS / ADC in the env
// contract) — it could only ever throw. If you want first-class OCR, wire up
// Vision credentials deliberately and reinstate a real client here.
async function extractTextWithGemini(buffer: Buffer): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is not set for OCR fallback.");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: AI_CONFIG.ocrModel });
  const prompt =
    "Please extract all readable text from this document accurately. " +
    "Preserve the original structure and formatting as much as possible.";
  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType: "application/pdf",
      },
    },
  ]);
  return result.response.text() || "";
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
