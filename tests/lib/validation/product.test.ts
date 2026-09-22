import { describe, expect, it } from "vitest";

import { productFormSchema } from "@/lib/validation/product";

describe("productFormSchema", () => {
  const baseNew = {
    type: "new" as const,
    model: "iPhone 13",
    storage: "128GB",
    acquisitionCost: 2500,
    repairCost: 0,
    quantity: 3,
  };

  const baseSemiNovo = {
    type: "semi_novo" as const,
    model: "iPhone 12",
    storage: "64GB",
    acquisitionCost: 1800,
    repairCost: 100,
    imei: "123456789012345",
  };

  it("accepts a valid new (batch) product", () => {
    expect(productFormSchema.safeParse(baseNew).success).toBe(true);
  });

  it("accepts a valid semi_novo product with a 15-digit IMEI", () => {
    expect(productFormSchema.safeParse(baseSemiNovo).success).toBe(true);
  });

  it("rejects semi_novo without an IMEI", () => {
    const result = productFormSchema.safeParse({ ...baseSemiNovo, imei: "" });
    expect(result.success).toBe(false);
  });

  it("rejects semi_novo with an IMEI that isn't 15 digits", () => {
    const result = productFormSchema.safeParse({ ...baseSemiNovo, imei: "12345" });
    expect(result.success).toBe(false);
  });

  it("rejects a model shorter than 2 characters", () => {
    expect(productFormSchema.safeParse({ ...baseNew, model: "a" }).success).toBe(false);
  });

  it("rejects zero or negative acquisition cost", () => {
    expect(productFormSchema.safeParse({ ...baseNew, acquisitionCost: 0 }).success).toBe(false);
  });

  it("rejects quantity below 1", () => {
    expect(productFormSchema.safeParse({ ...baseNew, quantity: 0 }).success).toBe(false);
  });

  it("coerces numeric strings for cost and quantity", () => {
    const result = productFormSchema.safeParse({ ...baseNew, acquisitionCost: "2500", quantity: "3" });
    expect(result.success).toBe(true);
  });
});
