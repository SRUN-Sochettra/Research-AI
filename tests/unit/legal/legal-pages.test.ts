import { describe, expect, it } from "vitest";
import { LIMITS } from "@/lib/utils/constants";
import { deleteAccountSchema, chatSchema } from "@/types/api";

describe("legal and service disclosures", () => {
  it("keeps the public limit values within expected product bounds", () => {
    expect(LIMITS.maxFileSize).toBe(10 * 1024 * 1024);
    expect(LIMITS.maxDocumentsPerUser).toBe(10);
    expect(LIMITS.maxMessageLength).toBe(5000);
    expect(LIMITS.rateLimit.maxRequests).toBe(10);
  });

  it("validates chat message length limit accurately against 5000 chars", () => {
    const valid = chatSchema.safeParse({
      message: "a".repeat(5000),
      documentId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(valid.success).toBe(true);

    const invalid = chatSchema.safeParse({
      message: "a".repeat(5001),
      documentId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(invalid.success).toBe(false);
  });

  it("enforces explicit DELETE confirmation for account deletion", () => {
    expect(
      deleteAccountSchema.safeParse({ confirmation: "DELETE" }).success
    ).toBe(true);
    expect(
      deleteAccountSchema.safeParse({ confirmation: "delete" }).success
    ).toBe(false);
    expect(deleteAccountSchema.safeParse({ confirmation: "" }).success).toBe(
      false
    );
    expect(deleteAccountSchema.safeParse({}).success).toBe(false);
  });
});
