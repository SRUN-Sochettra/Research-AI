// src/app/api/summarize/route.ts
//
// Returns the AI-generated summary for a document.
//
// The summary is produced once during ingestion (orchestrator → summarizer)
// and stored on the document row (`documents.summary`). This endpoint simply
// returns that stored summary — no LLM call, so no cost/abuse surface and no
// need for the fallback-chain machinery. Follows the standard
// auth → rate-limit → validate → ApiResponse envelope pattern established in
// src/app/api/upload/route.ts.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/db/supabase/server";
import { checkRateLimit } from "@/lib/services/rate-limiter";
import { getDocumentById } from "@/lib/db/queries/documents";
import { summarizeSchema } from "@/types/api";
import type { ApiResponse, SummarizeResponse } from "@/types/api";
import { toErrorResponse } from "@/lib/utils/errors";
import { logger } from "@/lib/observability/logger";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<SummarizeResponse>>> {
  try {
    // ─── 1. Auth ────────────────────────────────────────
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 }
      );
    }

    // ─── 2. Rate Limit ──────────────────────────────────
    const rateLimit = await checkRateLimit(`summarize:${user.id}`);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests. Please wait a minute.",
          },
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(rateLimit.limit),
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": String(rateLimit.reset),
          },
        }
      );
    }

    // ─── 3. Validate Body ───────────────────────────────
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" },
        },
        { status: 400 }
      );
    }

    const parsed = summarizeSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { documentId } = parsed.data;

    // ─── 4. Fetch Document (RLS-scoped to this user) ────
    const document = await getDocumentById(documentId, user.id);
    if (!document) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Document not found" },
        },
        { status: 404 }
      );
    }

    // ─── 5. Guard: must be fully processed ──────────────
    if (document.status !== "ready") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_READY",
            message:
              document.status === "error"
                ? "Document processing failed; no summary available."
                : "Document is still processing. Please wait.",
          },
        },
        { status: 409 }
      );
    }

    if (!document.summary) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "No summary is available for this document.",
          },
        },
        { status: 404 }
      );
    }

    logger.info("[SummarizeAPI] Summary served", {
      documentId,
      summaryLength: document.summary.length,
    });

    // ─── 6. Success ─────────────────────────────────────
    return NextResponse.json({
      success: true,
      data: {
        documentId,
        summary: document.summary,
      },
    });
  } catch (error) {
    const { code, message, statusCode } = toErrorResponse(error);
    return NextResponse.json(
      { success: false, error: { code, message } },
      { status: statusCode }
    );
  }
}
