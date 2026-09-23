import { describe, it, expect } from "vitest";

import { sellerSchema } from "@/lib/validation/seller";

describe("sellerSchema", () => {
  it("accepts an empty email (edit mode hides the email field)", () => {
    expect(sellerSchema.safeParse({ name: "Ana", email: "", role: "seller", commission_rate: 0.05 }).success).toBe(
      true
    );
  });
  it("accepts a valid email (create/invite mode)", () => {
    expect(
      sellerSchema.safeParse({ name: "Ana", email: "ana@example.com", role: "seller", commission_rate: 0.05 }).success
    ).toBe(true);
  });
  it("rejects a malformed non-empty email", () => {
    expect(
      sellerSchema.safeParse({ name: "Ana", email: "not-an-email", role: "seller", commission_rate: 0.05 }).success
    ).toBe(false);
  });
  it("rejects a commission rate above 1", () => {
    expect(sellerSchema.safeParse({ name: "Ana", email: "", role: "seller", commission_rate: 1.5 }).success).toBe(
      false
    );
  });
});
