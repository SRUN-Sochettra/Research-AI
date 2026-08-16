import { NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/db/supabase/server";
import { checkRateLimit } from "@/lib/services/rate-limiter";
import { runQAAgent } from "@/lib/agents/qa-agent";
import {
  getOrCreateConversation,
  getConversationMessages,
  saveMessage,
} from "@/lib/db/queries/conversations";
import { getDocumentById } from "@/lib/db/queries/documents";
import { chatSchema } from "@/types/api";
import { logger } from "@/lib/observability/logger";

export const maxDuration = 60;

// Use native ReadableStream for streaming
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // ─── 1. Auth Check ──────────────────────────────────────
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ─── 2. Validate Request Body ───────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: parsed.error.flatten(),
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { message, documentId, documentIds, conversationId } = parsed.data;

  // ─── 3. Rate Limit ──────────────────────────────────────
  const rateLimit = await checkRateLimit(`chat:${user.id}`);
  if (!rateLimit.success) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please slow down." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Reset": String(rateLimit.reset),
        },
      }
    );
  }

  // ─── 4. Verify Document Exists & is Ready ───────────────
  if (documentId) {
    const document = await getDocumentById(documentId, user.id);
    if (!document) {
      return new Response(JSON.stringify({ error: "Document not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (document.status !== "ready") {
      return new Response(
        JSON.stringify({
          error: "Document is still processing. Please wait.",
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }
  } else if (documentIds) {
    for (const dId of documentIds) {
      const document = await getDocumentById(dId, user.id);
      if (!document) {
        return new Response(
          JSON.stringify({ error: "One or more documents not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      if (document.status !== "ready") {
        return new Response(
          JSON.stringify({
            error: "One or more documents are still processing. Please wait.",
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }

  // ─── 5. Get or Create Conversation & Pre-stream Setup ──────
  let conversation;
  let history;
  try {
    conversation = await getOrCreateConversation(
      user.id,
      documentId,
      conversationId,
      documentIds
    );

    history = await getConversationMessages(
      conversation.id,
      20 // Last 20 messages for context
    );

    await saveMessage({
      conversationId: conversation.id,
      role: "user",
      content: message,
    });
  } catch (error) {
    const isSyntaxOrProviderError =
      error instanceof Error &&
      (error.message.includes("JSON.parse") ||
        error.name === "SyntaxError" ||
        error.message.includes("Unexpected token"));

    logger.error(
      "[ChatAPI] Pre-stream setup failed",
      error instanceof Error ? error : new Error("Pre-stream error"),
      { documentId }
    );

    const errorMessage = isSyntaxOrProviderError
      ? "The AI provider returned an invalid response. Please retry."
      : "Failed to process chat request. Please try again.";

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ─── 8. Build Streaming Response ────────────────────────
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, payload: Record<string, unknown>) => {
        const data = `data: ${JSON.stringify({ type, ...payload })}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      send("meta", { conversationId: conversation.id });

      try {
        await runQAAgent(
          message,
          user.id,
          conversation.id,
          history,
          {
            onToken: (token) => {
              send("token", { content: token });
            },

            onComplete: async (result) => {
              try {
                const latencyMs = Date.now() - startTime;

                const saved = await saveMessage({
                  conversationId: conversation.id,
                  role: "assistant",
                  content: result.answer,
                  citations: result.citations,
                  latencyMs,
                });

                send("citations", {
                  citations: result.citations,
                  messageId: saved.id,
                  latencyMs,
                });

                send("done", {
                  messageId: saved.id,
                  conversationId: conversation.id,
                });

                logger.info("[ChatAPI] Stream complete", {
                  documentId,
                  documentIds,
                  conversationId: conversation.id,
                  latencyMs,
                  citationCount: result.citations.length,
                });
              } catch (saveError) {
                logger.error(
                  "[ChatAPI] Failed to save assistant message",
                  saveError instanceof Error
                    ? saveError
                    : new Error("Unknown save error")
                );
                send("error", {
                  message: "Failed to save response",
                });
              } finally {
                controller.close();
              }
            },

            onError: (error) => {
              const isSyntaxOrProviderError =
                error instanceof Error &&
                (error.message.includes("JSON.parse") ||
                  error.name === "SyntaxError" ||
                  error.message.includes("Unexpected token"));

              logger.error(
                "[ChatAPI] QA agent error",
                error instanceof Error ? error : new Error("QA agent error"),
                { documentId }
              );

              const userMessage = isSyntaxOrProviderError
                ? "The AI provider returned an invalid response. Please retry."
                : "Failed to generate response. Please try again.";

              send("error", {
                message: userMessage,
              });
              controller.close();
            },
          },
          documentId,
          documentIds
        );
      } catch (error) {
        const isSyntaxOrProviderError =
          error instanceof Error &&
          (error.message.includes("JSON.parse") ||
            error.name === "SyntaxError" ||
            error.message.includes("Unexpected token"));

        logger.error(
          "[ChatAPI] Unexpected error",
          error instanceof Error ? error : new Error("Unknown"),
          { documentId }
        );

        const userMessage = isSyntaxOrProviderError
          ? "The AI provider returned an invalid response. Please retry."
          : "Unexpected error occurred.";

        send("error", { message: userMessage });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable Nginx buffering
    },
  });
}
