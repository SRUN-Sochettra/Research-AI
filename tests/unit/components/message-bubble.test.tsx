import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageBubble } from "@/components/chat/message-bubble";
import type { ChatMessage } from "@/hooks/use-chat";

const message: ChatMessage = {
  id: "assistant-1",
  role: "assistant",
  content: "**bold** <img onerror=alert(1)> <script>alert(1)</script>",
  citations: [],
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

describe("MessageBubble", () => {
  it("renders markdown bold but keeps HTML-looking text inert", () => {
    const { container } = render(<MessageBubble message={message} />);

    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain("<img onerror=alert(1)>");
    expect(container.textContent).toContain("<script>alert(1)</script>");
  });
});
