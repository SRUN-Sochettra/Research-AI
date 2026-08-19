// src/app/api/embed/route.ts
//
// Embeddings utility endpoint. Turns text into gemini-embedding-001 vectors
// (3072-dim), the same model/space used for document chunks — so results are
// directly comparable to what's stored in document_chunks.embedding.
//
// This REPLACES the previous no-op stub. It follows the same
// auth → rate-limit → validate → ApiResponse envelope pattern as
// src/app/api/upload/route.ts.
//
// NOTE: This is a raw embedding utility (useful for debugging, custom search,
// or external tooling). The ingestion pipeline does NOT depend on it — chunk
// embedding still happens in src/lib/agents/embedder.ts during upload.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/db/supabase/server";
import { checkRateLimit } from "@/lib/services/rate-limiter";
import { getEmbeddingModel } from "@/lib/ai/gemini";
import { embedQuery } from "@/lib/agents/embedder";
import { AI_CONFIG } from "@/lib/utils/constants";
import { embedSchema } from "@/types/api";
import type { ApiResponse, EmbedResponse } from "@/types/api";
import { toErrorResponse } from "@/lib/utils/errors";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<EmbedResponse>>> {
  try {
    // ─── 1. Auth Check ──────────────────────────────────
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
    const rateLimit = await checkRateLimit(`embed:${user.id}`);

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
            "Retry-After": String(
              Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000))
            ),
          },
        }
      );
    }

    // ─── 3. Parse + Validate Body ───────────────────────
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

    const parsed = embedSchema.safeParse(json);
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

    // ─── 4. Generate Embedding(s) ───────────────────────
    // Single text → embedQuery; array → batched embedDocuments.
    if ("text" in parsed.data) {
      const embedding = await embedQuery(parsed.data.text);

      return NextResponse.json({
        success: true,
        data: {
          model: AI_CONFIG.embeddingModel,
          dimension: AI_CONFIG.embeddingDimension,
          embeddings: [embedding],
        },
      });
    }

    const embedder = getEmbeddingModel();
    const embeddings = await embedder.embedDocuments(parsed.data.texts);

    return NextResponse.json({
      success: true,
      data: {
        model: AI_CONFIG.embeddingModel,
        dimension: AI_CONFIG.embeddingDimension,
        embeddings,
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
