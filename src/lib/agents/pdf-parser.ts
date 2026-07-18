// src/lib/agents/pdf-parser.ts
import { AppError } from "@/lib/utils/errors";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
      try {
        const ocrText = await extractTextWithVision(buffer);
        const cleanOcrText = cleanPDFText(ocrText);
        if (!cleanOcrText || cleanOcrText.length < 50) throw new AppError("Invalid PDF", "INVALID_PDF_CONTENT", 400);
        return { text: cleanOcrText, pageCount: pageCount > 0 ? pageCount : 1, pages: [cleanOcrText], metadata: {} };
      } catch (ocrError) {
         if (ocrError instanceof AppError) throw ocrError;
         throw new AppError("PDF empty", "INVALID_PDF_CONTENT", 400);
      }
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


async function extractTextWithVision(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const vision = require("@google-cloud/vision");
  const client = new vision.ImageAnnotatorClient();

  const request = {
    requests: [
      {
        inputConfig: {
          mimeType: "application/pdf",
          content: buffer.toString("base64"),
        },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
      },
    ],
  };

  try {
    const [result] = await client.batchAnnotateFiles(request);
    const responses = result.responses?.[0]?.responses || [];

    let fullText = "";
    for (const response of responses) {
      if (response.fullTextAnnotation?.text) {
        fullText += response.fullTextAnnotation.text + "\n\n";
      }
    }

    if (fullText.trim().length > 0) {
      return fullText.trim();
    }
  } catch (error) {
    console.warn("Google Vision API failed, falling back to Gemini:", error);
  }

  // Fallback to Gemini if Vision fails or returns no text
  return await extractTextWithGemini(buffer);
}

async function extractTextWithGemini(buffer: Buffer): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is not set for OCR fallback.");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = "Please extract all readable text from this document accurately. Preserve the original structure and formatting as much as possible.";
  const result = await model.generateContent([
    prompt, { inlineData: { data: buffer.toString("base64"), mimeType: "application/pdf" } }
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