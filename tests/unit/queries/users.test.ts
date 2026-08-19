import { describe, expect, it, vi, beforeEach } from "vitest";
import { deleteUserAccount } from "@/lib/db/queries/users";
import { getSupabaseAdminClient } from "@/lib/db/supabase/admin";
import { logger } from "@/lib/observability/logger";

vi.mock("@/lib/db/supabase/admin", () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/lib/db/supabase/server", () => ({
  getSupabaseServerClient: vi.fn(),
}));

describe("deleteUserAccount & Strict Synchronous Order", () => {
  const mockRemove = vi.fn();
  const mockList = vi.fn();
  const mockDelete = vi.fn();
  const mockDeleteUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockRemove.mockResolvedValue({ data: ["doc1.pdf"], error: null });
    mockList.mockResolvedValue({
      data: [{ name: "lingering.pdf" }],
      error: null,
    });
    mockDelete.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    mockDeleteUser.mockResolvedValue({ error: null });

    const mockAdmin = {
      storage: {
        from: vi.fn().mockReturnValue({
          remove: mockRemove,
          list: mockList,
        }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "documents") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: "doc-1", file_path: "user-123/doc1.pdf" }],
                error: null,
              }),
            }),
            delete: mockDelete,
          };
        }
        return {
          delete: mockDelete,
        };
      }),
      auth: {
        admin: {
          deleteUser: mockDeleteUser,
        },
      },
    };

    vi.mocked(getSupabaseAdminClient).mockReturnValue(
      mockAdmin as unknown as ReturnType<typeof getSupabaseAdminClient>
    );
  });

  it("deletes storage objects, database rows, and auth user in order", async () => {
    const result = await deleteUserAccount("user-123");

    expect(mockList).toHaveBeenCalledWith("user-123");
    expect(mockRemove).toHaveBeenCalled();
    expect(mockDelete).toHaveBeenCalled();
    expect(mockDeleteUser).toHaveBeenCalledWith("user-123");
    expect(result.deletedDocumentsCount).toBe(1);
  });

  it("stops and prevents DB and Auth deletion if Storage listing fails", async () => {
    mockList.mockResolvedValueOnce({
      data: null,
      error: new Error("Storage S3 listing 500 error"),
    });
    const errorSpy = vi.spyOn(logger, "error");

    await expect(deleteUserAccount("user-123")).rejects.toThrow(
      "Failed to enumerate storage objects for deletion: Storage S3 listing 500 error"
    );

    expect(errorSpy).toHaveBeenCalledWith(
      "Account deletion failed during storage enumeration",
      expect.any(Error),
      expect.objectContaining({
        stage: "storage_enumeration",
        userId: "user-123",
      })
    );

    // Database delete must NOT be called
    expect(mockDelete).not.toHaveBeenCalled();
    // Auth delete must NOT be called
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("stops and prevents DB and Auth deletion if Storage removal fails", async () => {
    mockRemove.mockResolvedValueOnce({
      data: null,
      error: new Error("Storage S3 remove forbidden"),
    });
    const errorSpy = vi.spyOn(logger, "error");

    await expect(deleteUserAccount("user-123")).rejects.toThrow(
      "Failed to remove storage objects during account deletion: Storage S3 remove forbidden"
    );

    expect(errorSpy).toHaveBeenCalledWith(
      "Account deletion failed during storage removal",
      expect.any(Error),
      expect.objectContaining({ stage: "storage_removal", userId: "user-123" })
    );

    // Database delete must NOT be called
    expect(mockDelete).not.toHaveBeenCalled();
    // Auth delete must NOT be called
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("stops and prevents Auth deletion if Database deletion fails", async () => {
    mockDelete.mockReturnValueOnce({
      eq: vi.fn().mockResolvedValue({ error: new Error("Database deadlock") }),
    });
    const errorSpy = vi.spyOn(logger, "error");

    await expect(deleteUserAccount("user-123")).rejects.toThrow(
      "Failed to delete user conversations: Database deadlock"
    );

    expect(errorSpy).toHaveBeenCalledWith(
      "Account deletion failed during conversations deletion",
      expect.any(Error),
      expect.objectContaining({
        stage: "database_conversations",
        userId: "user-123",
      })
    );

    // Auth delete must NOT be called
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("reports Auth deletion failure honestly after application data deletion", async () => {
    mockDeleteUser.mockResolvedValue({
      error: new Error("Auth service unavailable"),
    });
    const errorSpy = vi.spyOn(logger, "error");

    await expect(deleteUserAccount("user-123")).rejects.toThrow(
      "Failed to delete auth user: Auth service unavailable"
    );

    expect(errorSpy).toHaveBeenCalledWith(
      "Account deletion failed during auth user deletion",
      expect.any(Error),
      expect.objectContaining({ stage: "auth_deletion", userId: "user-123" })
    );
  });

  it("allows safe and idempotent retry when user is already removed from Auth", async () => {
    mockDeleteUser.mockResolvedValue({
      error: new Error("User not found"),
    });

    const result = await deleteUserAccount("user-123");
    expect(result).toBeDefined();
    expect(result.deletedDocumentsCount).toBe(1);
  });

  it("ensures no PII or secrets appear in log context across all stages", async () => {
    const infoSpy = vi.spyOn(logger, "info");
    await deleteUserAccount("user-123");

    const logCalls = infoSpy.mock.calls;
    for (const [message, context] of logCalls) {
      const serialized = JSON.stringify({ message, context });
      expect(serialized).not.toContain("password");
      expect(serialized).not.toContain("token");
      expect(serialized).not.toContain("service_role");
      expect(serialized).not.toContain("@synapsedoc");
    }
  });
});
