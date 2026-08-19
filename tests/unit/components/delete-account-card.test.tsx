import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DeleteAccountCard } from "@/components/settings/delete-account-card";

const mockPush = vi.fn();
const mockSignOut = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    signOut: mockSignOut,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("DeleteAccountCard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders card title and description", () => {
    render(<DeleteAccountCard />);
    expect(screen.getByText("Delete Account")).toBeDefined();
    expect(
      screen.getByRole("button", { name: /delete my account/i })
    ).toBeDefined();
  });

  it("opens confirmation dialog when clicked and requires exact DELETE text", async () => {
    render(<DeleteAccountCard />);

    const openBtn = screen.getByRole("button", { name: /delete my account/i });
    fireEvent.click(openBtn);

    expect(screen.getByText("Confirm Account Deletion")).toBeDefined();

    const deleteBtn = screen.getByRole("button", {
      name: /permanently delete/i,
    });
    expect(deleteBtn).toBeDisabled();

    const input = screen.getByLabelText(/confirm deletion by typing delete/i);

    // Typing lowercase 'delete' keeps button disabled
    fireEvent.change(input, { target: { value: "delete" } });
    expect(deleteBtn).toBeDisabled();

    // Typing exact uppercase 'DELETE' enables button
    fireEvent.change(input, { target: { value: "DELETE" } });
    expect(deleteBtn).not.toBeDisabled();
  });

  it("prevents duplicate submissions and shows loading indicator while deleting", async () => {
    let resolveFetch: (val: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    vi.mocked(global.fetch).mockReturnValue(
      fetchPromise as unknown as Promise<Response>
    );

    render(<DeleteAccountCard />);
    fireEvent.click(screen.getByRole("button", { name: /delete my account/i }));

    const input = screen.getByLabelText(/confirm deletion by typing delete/i);
    fireEvent.change(input, { target: { value: "DELETE" } });

    const deleteBtn = screen.getByRole("button", {
      name: /permanently delete/i,
    });
    fireEvent.click(deleteBtn);

    // Expect loading state and disabled input/button
    expect(screen.getByText(/deleting.../i)).toBeDefined();
    expect(input).toBeDisabled();

    // Resolve fetch
    resolveFetch!({
      ok: true,
      json: async () => ({ success: true, data: { deleted: true } }),
    });

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });
});
