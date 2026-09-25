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
  it("takes an optional phone in any format and keeps the digits", () => {
    const base = { name: "Ana", email: "", role: "seller" as const, commission_rate: 0.05 };
    const withPhone = sellerSchema.safeParse({ ...base, phone: "11 98765-4321" });
    expect(withPhone.success && withPhone.data.phone).toBe("11987654321");
    expect(sellerSchema.safeParse({ ...base, phone: "" }).success).toBe(true);
    expect(sellerSchema.safeParse({ ...base, phone: "9876" }).success).toBe(false);
  });
});
