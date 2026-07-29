import { describe, it, expect } from "vitest";
import {
  formatFileSize,
  truncateText,
  generateTitle,
} from "@/lib/utils/helpers";

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(500)).toBe("500 Bytes");
  });

  it("formats kilobytes", () => {
    expect(formatFileSize(1024)).toBe("1 KB");
  });

  it("formats megabytes", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1 MB");
  });

  it("handles zero", () => {
    expect(formatFileSize(0)).toBe("0 Bytes");
  });
});

describe("truncateText", () => {
  it("does not truncate short text", () => {
    expect(truncateText("Hello", 10)).toBe("Hello");
  });

  it("truncates long text with ellipsis", () => {
    const result = truncateText("Hello World", 8);
    expect(result).toBe("Hello...");
    expect(result.length).toBe(8);
  });
});

describe("generateTitle", () => {
  it("removes .pdf extension", () => {
    expect(generateTitle("my-document.pdf")).toBe("My Document");
  });

  it("replaces hyphens with spaces", () => {
    expect(generateTitle("research-paper.pdf")).toBe("Research Paper");
  });

  it("handles underscores", () => {
    expect(generateTitle("annual_report.pdf")).toBe("Annual Report");
  });
});
