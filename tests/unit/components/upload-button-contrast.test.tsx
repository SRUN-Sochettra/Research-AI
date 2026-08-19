import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/shared/empty-states";

describe("Button color contrast and accessibility", () => {
  it("renders empty state button with text-primary-foreground and bg-primary", () => {
    render(
      <EmptyState
        title="No documents yet"
        description="Upload your first PDF to begin"
        action={{
          label: "Upload your first PDF",
          onClick: () => {},
        }}
      />
    );

    const button = screen.getByRole("button", {
      name: /upload your first pdf/i,
    });
    expect(button).toBeDefined();
    expect(button.className).toContain("bg-primary");
    expect(button.className).toContain("text-primary-foreground");
    expect(button.className).not.toContain("text-white");
  });

  it("renders empty state link button with text-primary-foreground and bg-primary", () => {
    render(
      <EmptyState
        title="No documents to compare"
        description="Upload at least two PDFs to compare them"
        action={{
          label: "Upload your first PDF",
          href: "/documents?upload=true",
        }}
      />
    );

    const link = screen.getByRole("link", { name: /upload your first pdf/i });
    expect(link).toBeDefined();
    expect(link.className).toContain("bg-primary");
    expect(link.className).toContain("text-primary-foreground");
    expect(link.className).not.toContain("text-white");
  });
});
