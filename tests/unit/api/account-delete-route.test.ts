import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/account/delete/route";
import { NextRequest } from "next/server";
import * as userQueries from "@/lib/db/queries/users";
import * as rateLimiter from "@/lib/services/rate-limiter";
import * as serverClient from "@/lib/db/supabase/server";

vi.mock("@/lib/db/queries/users", () => ({
  deleteUserAccount: vi.fn(),
}));

vi.mock("@/lib/services/rate-limiter", () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock("@/lib/db/supabase/server", () => ({
  getSupabaseServerClient: vi.fn(),
}));

describe("POST /api/account/delete", () => {
  const mockSignOut = vi.fn();
  const mockGetUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });
    mockSignOut.mockResolvedValue({ error: null });

    vi.mocked(serverClient.getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: mockGetUser,
        signOut: mockSignOut,
      },
    } as unknown as Awaited<
      ReturnType<typeof serverClient.getSupabaseServerClient>
    >);

    vi.mocked(rateLimiter.checkRateLimit).mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60000,
    });

    vi.mocked(userQueries.deleteUserAccount).mockResolvedValue({
      deletedDocumentsCount: 1,
      deletedFilesCount: 1,
    });
  });

  it("returns 401 Unauthorized if user is not logged in", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error("Not logged in"),
    });

    const req = new NextRequest("http://localhost:3000/api/account/delete", {
      method: "POST",
      body: JSON.stringify({ confirmation: "DELETE" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 429 Rate Limited with Retry-After header when rate limit is exceeded", async () => {
    vi.mocked(rateLimiter.checkRateLimit).mockResolvedValueOnce({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 30000,
    });

    const req = new NextRequest("http://localhost:3000/api/account/delete", {
      method: "POST",
      body: JSON.stringify({ confirmation: "DELETE" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
    expect(res.headers.get("X-RateLimit-Limit")).toBe("10");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(res.headers.get("Retry-After")).toBeDefined();
  });

  it("returns 400 Validation Error if confirmation string is not exactly 'DELETE'", async () => {
    const req = new NextRequest("http://localhost:3000/api/account/delete", {
      method: "POST",
      body: JSON.stringify({ confirmation: "delete" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("successfully executes deletion when confirmation is 'DELETE'", async () => {
    const req = new NextRequest("http://localhost:3000/api/account/delete", {
      method: "POST",
      body: JSON.stringify({ confirmation: "DELETE" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.deletedDocumentsCount).toBe(1);
    expect(data.data.deletedFilesCount).toBe(1);
    expect(userQueries.deleteUserAccount).toHaveBeenCalledWith("user-123");
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("returns 500 when deleteUserAccount fails", async () => {
    vi.mocked(userQueries.deleteUserAccount).mockRejectedValueOnce(
      new Error("Storage service failed")
    );

    const req = new NextRequest("http://localhost:3000/api/account/delete", {
      method: "POST",
      body: JSON.stringify({ confirmation: "DELETE" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error.code).toBe("INTERNAL_ERROR");
  });
});
