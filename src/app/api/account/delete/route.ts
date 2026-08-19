import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/db/supabase/server";
import { checkRateLimit } from "@/lib/services/rate-limiter";
import { deleteUserAccount } from "@/lib/db/queries/users";
import {
  deleteAccountSchema,
  type ApiResponse,
  type DeleteAccountResponse,
} from "@/types/api";
import { toErrorResponse } from "@/lib/utils/errors";
import { logger } from "@/lib/observability/logger";

export const maxDuration = 60;

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<DeleteAccountResponse>>> {
  try {
    // 1. Auth check
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

    // 2. Rate limit (protection against abuse)
    const rateLimit = await checkRateLimit(`delete_account:${user.id}`);
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

    // 3. Parse & Validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid JSON body",
          },
        },
        { status: 400 }
      );
    }

    const parsed = deleteAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message:
              "Explicit confirmation required: confirmation must be 'DELETE'",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // 4. Perform complete account and data deletion
    logger.info("Initiating account deletion", { userId: user.id });

    const result = await deleteUserAccount(user.id);

    // 5. Sign out current session
    try {
      await supabase.auth.signOut();
    } catch (signOutError) {
      logger.warn("SignOut warning following account deletion", {
        userId: user.id,
        error: signOutError instanceof Error ? signOutError.message : "Unknown",
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: "Account and associated data deleted successfully.",
        deletedDocumentsCount: result.deletedDocumentsCount,
        deletedFilesCount: result.deletedFilesCount,
      },
    });
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
