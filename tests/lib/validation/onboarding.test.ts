import { describe, expect, it } from "vitest";

import { onboardingSchema } from "@/lib/validation/onboarding";

describe("onboardingSchema", () => {
  it("accepts owner and store names without a document or revenue goal", () => {
    const result = onboardingSchema.safeParse({ ownerName: "Ana", storeName: "iStore Centro" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.cnpj).toBeUndefined();
  });

  it("rejects a store name shorter than 2 characters", () => {
    expect(onboardingSchema.safeParse({ ownerName: "Ana", storeName: "a" }).success).toBe(false);
  });

  it("rejects a blank owner name", () => {
    expect(onboardingSchema.safeParse({ ownerName: " ", storeName: "iStore" }).success).toBe(false);
  });

  it("normalizes a masked CNPJ when present", () => {
    const result = onboardingSchema.safeParse({ ownerName: "Ana", storeName: "iStore", cnpj: "12.345.678/0001-95" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.cnpj).toBe("12345678000195");
  });

  it("accepts a CPF instead of a CNPJ", () => {
    const result = onboardingSchema.safeParse({ ownerName: "Ana", storeName: "iStore", cnpj: "529.982.247-25" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.cnpj).toBe("52998224725");
  });

  it("rejects a document with the wrong length or check digits", () => {
    expect(onboardingSchema.safeParse({ ownerName: "Ana", storeName: "iStore", cnpj: "123" }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ownerName: "Ana", storeName: "iStore", cnpj: "529.982.247-26" }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ownerName: "Ana", storeName: "iStore", cnpj: "12.345.678/0001-96" }).success).toBe(false);
  });
});
