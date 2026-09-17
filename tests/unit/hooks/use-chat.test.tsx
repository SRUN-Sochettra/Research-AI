import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useChat } from "@/hooks/use-chat";

function streamResponse(events: unknown[]) {
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(
        new TextEncoder().encode(
          events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join("")
        )
      );
      controller.close();
    },
  });

  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("useChat", () => {
  it("omits conversationId from the first-message request body", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        streamResponse([{ type: "done", messageId: "message-1" }])
      );

    const { result } = renderHook(() => useChat({ documentId: "document-1" }));

    await act(async () => {
      await result.current.sendMessage("Question");
    });

    const requestBody = JSON.parse(
      fetchMock.mock.calls[0]?.[1]?.body as string
    ) as Record<string, unknown>;

    expect(
      Object.prototype.hasOwnProperty.call(requestBody, "conversationId")
    ).toBe(false);
    expect(requestBody).toMatchObject({
      message: "Question",
      documentId: "document-1",
    });
  });

  it("preserves an existing conversation UUID in the request body", async () => {
    const conversationId = "8c8481c5-fb66-45f7-9d2c-70185a5d0501";
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        streamResponse([{ type: "done", messageId: "message-1" }])
      );

    const { result } = renderHook(() =>
      useChat({
        documentId: "document-1",
        initialConversationId: conversationId,
      })
    );

    await act(async () => {
      await result.current.sendMessage("Follow-up question");
    });

    const requestBody = JSON.parse(
      fetchMock.mock.calls[0]?.[1]?.body as string
    ) as Record<string, unknown>;

    expect(requestBody.conversationId).toBe(conversationId);
  });

  it("updates live messages through streamed tokens, citations, and completion", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      streamResponse([
        { type: "meta", conversationId: "conversation-1" },
        { type: "token", content: "Answer" },
        {
          type: "citations",
          citations: [],
          latencyMs: 120,
        },
        { type: "done", messageId: "message-1" },
      ])
    );

    const { result } = renderHook(() => useChat({ documentId: "document-1" }));

    await act(async () => {
      await result.current.sendMessage("Question");
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.conversationId).toBe("conversation-1");
    expect(result.current.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "user",
          content: "Question",
        }),
        expect.objectContaining({
          id: "message-1",
          role: "assistant",
          content: "Answer",
          citations: [],
          latencyMs: 120,
          isStreaming: false,
        }),
      ])
    );
  });

  it("starts with a new empty conversation when given no initial messages", () => {
    const { result } = renderHook(() =>
      useChat({ documentId: "document-1", initialMessages: [] })
    );

    expect(result.current.messages).toEqual([]);
    expect(result.current.conversationId).toBeNull();
  });
});
