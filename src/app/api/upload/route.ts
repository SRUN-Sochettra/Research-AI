import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/db/supabase/server";
import { checkRateLimit } from "@/lib/services/rate-limiter";
import { createDocument, getUserDocumentCount } from "@/lib/db/queries/documents";
import { runDocumentPipeline } from "@/lib/agents/orchestrator";
import { toErrorResponse } from "@/lib/utils/errors";
import { generateTitle } from "@/lib/utils/helpers";
import { LIMITS } from "@/lib/utils/constants";
import type { ApiResponse, UploadResponse } from "@/types/api";

// Vercel max duration for this route
export const maxDuration = 60;

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<UploadResponse>>> {
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
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 }
      );
    }

    // ─── 2. Rate Limit ──────────────────────────────────
    const rateLimit = await checkRateLimit(`upload:${user.id}`);

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

    // ─── 3. Parse Form Data ─────────────────────────────
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "No file provided",
          },
        },
        { status: 400 }
      );
    }

    // ─── 4. Validate File ───────────────────────────────
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Only PDF files are accepted",
          },
        },
        { status: 400 }
      );
    }

    if (file.size > LIMITS.maxFileSize) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "File must be less than 10MB",
          },
        },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "File is empty",
          },
        },
        { status: 400 }
      );
    }

    // ─── 5. Check Document Limit ────────────────────────
    const docCount = await getUserDocumentCount(user.id);

    if (docCount >= LIMITS.maxDocumentsPerUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "LIMIT_EXCEEDED",
            message: `Maximum of ${LIMITS.maxDocumentsPerUser} documents reached. Delete some to upload more.`,
          },
        },
        { status: 403 }
      );
    }

    // ─── 6. Upload to Supabase Storage ──────────────────
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${user.id}/${Date.now()}_${fileName}`;

    const { error: storageError } = await supabase.storage
      .from("documents")
      .upload(filePath, fileBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (storageError) {
      console.error("Storage upload error:", storageError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "STORAGE_ERROR",
            message: "Failed to upload file. Please try again.",
          },
        },
        { status: 500 }
      );
    }

    // ─── 7. Create Document Record ──────────────────────
    const title =
      (formData.get("title") as string | null) ||
      generateTitle(file.name);

    const document = await createDocument({
      userId: user.id,
      title,
      fileName: file.name,
      filePath,
      fileSize: file.size,
      mimeType: file.type,
    });

    // ─── 8. Run Pipeline (async, non-blocking) ──────────
    // We return immediately and process in background
    // In production, use a queue (Inngest, Trigger.dev, etc.)
    // For portfolio: sufficient for demo purposes
    runDocumentPipeline({
      documentId: document.id,
      buffer: fileBuffer,
    }).catch((err) => {
      console.error(
        `Background pipeline failed for document ${document.id}:`,
        err
      );
    });

    // ─── 9. Return Success ──────────────────────────────
    return NextResponse.json(
      {
        success: true,
        data: {
          documentId: document.id,
          status: "processing",
          message:
            "Document uploaded successfully. AI processing started.",
        },
      },
      { status: 202 } // 202 Accepted - processing in background
    );
  } catch (error) {
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: errorResponse.code,
          message: errorResponse.message,
        },
      },
      { status: errorResponse.statusCode }
    );
  }
}