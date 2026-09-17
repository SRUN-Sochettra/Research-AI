import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/hooks/use-auth";

const mocks = vi.hoisted(() => {
  const push = vi.fn();
  const refresh = vi.fn();
  const signInWithPassword = vi.fn();
  const getUser = vi.fn();
  const unsubscribe = vi.fn();
  const onAuthStateChange = vi.fn();
  return {
    push,
    refresh,
    signInWithPassword,
    getUser,
    unsubscribe,
    onAuthStateChange,
    client: { auth: { getUser, onAuthStateChange, signInWithPassword } },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

vi.mock("@/lib/db/supabase/client", () => ({
  getSupabaseBrowserClient: () => mocks.client,
}));

const EMAIL = "researcher@example.com";
const PASSWORD = "correct-horse-battery-staple";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
  mocks.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: mocks.unsubscribe } },
  });
});

describe("useAuth signInWithEmail", () => {
  it("signs in with the submitted credentials, reports no error, and lands on /documents", async () => {
    mocks.signInWithPassword.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let outcome!: { error: string | null };
    await act(async () => {
      outcome = await result.current.signInWithEmail(EMAIL, PASSWORD);
    });

    expect(mocks.signInWithPassword).toHaveBeenCalledTimes(1);
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: EMAIL,
      password: PASSWORD,
    });
    expect(outcome).toEqual({ error: null });
    expect(mocks.push).toHaveBeenCalledTimes(1);
    expect(mocks.push).toHaveBeenCalledWith("/documents");
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  it("returns the provider error message and never navigates when credentials are rejected", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: "Invalid login credentials" },
    });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let outcome!: { error: string | null };
    await act(async () => {
      outcome = await result.current.signInWithEmail(EMAIL, PASSWORD);
    });

    expect(mocks.signInWithPassword).toHaveBeenCalledTimes(1);
    expect(outcome).toEqual({ error: "Invalid login credentials" });
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
