import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DELETE, PATCH } from "@/app/api/documents/[id]/route";
import * as documentQueries from "@/lib/db/queries/documents";
import { getSupabaseServerClient } from "@/lib/db/supabase/server";

vi.mock("@/lib/db/queries/documents", () => ({
  deleteDocument: vi.fn(),
  updateDocumentTitle: vi.fn(),
}));

vi.mock("@/lib/db/supabase/server", () => ({
  getSupabaseServerClient: vi.fn(),
}));

function createSupabase(user: { id: string } | null, ownsDocument: boolean) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: ownsDocument ? { id: "document-1" } : null,
    error: ownsDocument ? null : { code: "PGRST116" },
  });
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle,
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: vi.fn(() => query),
  };
}

function request(method: "PATCH" | "DELETE", body?: unknown) {
  return new NextRequest("http://localhost/api/documents/document-1", {
    method,
    ...(body === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
}

const params = Promise.resolve({ id: "document-1" });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PATCH /api/documents/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue(
      createSupabase(null, false) as never
    );

    const response = await PATCH(request("PATCH", { title: "Renamed" }), {
      params,
    });

    expect(response.status).toBe(401);
  });

  it("returns 400 for an invalid title", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue(
      createSupabase({ id: "user-1" }, true) as never
    );

    const response = await PATCH(request("PATCH", { title: "   " }), {
      params,
    });

    expect(response.status).toBe(400);
    expect(documentQueries.updateDocumentTitle).not.toHaveBeenCalled();
  });

  it("returns 404 for a missing or foreign document", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue(
      createSupabase({ id: "user-1" }, false) as never
    );

    const response = await PATCH(request("PATCH", { title: "Renamed" }), {
      params,
    });

    expect(response.status).toBe(404);
  });

  it("renames an owned document", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue(
      createSupabase({ id: "user-1" }, true) as never
    );

    const response = await PATCH(request("PATCH", { title: "  Renamed  " }), {
      params,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, title: "Renamed" });
    expect(documentQueries.updateDocumentTitle).toHaveBeenCalledWith(
      "document-1",
      "user-1",
      "Renamed"
    );
  });
});

describe("DELETE /api/documents/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue(
      createSupabase(null, false) as never
    );

    const response = await DELETE(request("DELETE"), { params });

    expect(response.status).toBe(401);
  });

  it("returns 404 for a missing or foreign document", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue(
      createSupabase({ id: "user-1" }, false) as never
    );

    const response = await DELETE(request("DELETE"), { params });

    expect(response.status).toBe(404);
    expect(documentQueries.deleteDocument).not.toHaveBeenCalled();
  });

  it("deletes an owned document", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue(
      createSupabase({ id: "user-1" }, true) as never
    );

    const response = await DELETE(request("DELETE"), { params });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(documentQueries.deleteDocument).toHaveBeenCalledWith(
      "document-1",
      "user-1"
    );
  });
});
