import { describe, it, expect, vi, beforeEach } from "vitest";
import { getOrCreateConversation } from "@/lib/db/queries/conversations";

const mockFrom = vi.fn();

vi.mock("@/lib/db/supabase/admin", () => {
  return {
    getSupabaseAdminClient: vi.fn(() => ({
      from: mockFrom,
    })),
  };
});

describe("Conversations Query Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a single-document conversation with exact document_id payload", async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: "conv-1",
        user_id: "user-123",
        document_id: "doc-456",
        title: "New Conversation",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    });

    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

    mockFrom.mockReturnValue({
      insert: mockInsert,
    });

    const conversation = await getOrCreateConversation("user-123", "doc-456");

    expect(mockFrom).toHaveBeenCalledWith("conversations");
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-123",
      title: "New Conversation",
      document_id: "doc-456",
    });
    expect(conversation.id).toBe("conv-1");
    expect(conversation.document_id).toBe("doc-456");
  });

  it("creates a multi-document conversation when documentIds array is provided", async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: "conv-multi-1",
        user_id: "user-123",
        document_ids: ["doc-1", "doc-2"],
        title: "New Conversation",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    });

    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

    mockFrom.mockReturnValue({
      insert: mockInsert,
    });

    const conversation = await getOrCreateConversation(
      "user-123",
      undefined,
      undefined,
      ["doc-1", "doc-2"]
    );

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-123",
      title: "New Conversation",
      document_ids: ["doc-1", "doc-2"],
    });
    expect(conversation.id).toBe("conv-multi-1");
  });

  it("retrieves existing conversation by ID scoped to the authenticated user", async () => {
    const existingConv = {
      id: "conv-existing-999",
      user_id: "user-owner",
      document_id: "doc-123",
      title: "Existing Title",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockSingle = vi.fn().mockResolvedValue({
      data: existingConv,
      error: null,
    });

    const mockEqUser = vi.fn().mockReturnValue({ single: mockSingle });
    const mockEqId = vi.fn().mockReturnValue({ eq: mockEqUser });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqId });

    mockFrom.mockReturnValue({
      select: mockSelect,
    });

    const conversation = await getOrCreateConversation(
      "user-owner",
      "doc-123",
      "conv-existing-999"
    );

    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockEqId).toHaveBeenCalledWith("id", "conv-existing-999");
    expect(mockEqUser).toHaveBeenCalledWith("user_id", "user-owner");
    expect(conversation).toEqual(existingConv);
  });

  it("creates a conversation with missing optional document fields (general chat)", async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: "conv-general",
        user_id: "user-123",
        title: "New Conversation",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    });

    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

    mockFrom.mockReturnValue({
      insert: mockInsert,
    });

    const conversation = await getOrCreateConversation("user-123");

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-123",
      title: "New Conversation",
    });
    expect(conversation.id).toBe("conv-general");
  });

  it("throws a descriptive error when database insert fails", async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "violates foreign key constraint" },
    });

    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

    mockFrom.mockReturnValue({
      insert: mockInsert,
    });

    await expect(
      getOrCreateConversation("invalid-user", "doc-1")
    ).rejects.toThrow(
      "Failed to create conversation: violates foreign key constraint"
    );
  });
});
