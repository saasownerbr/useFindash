import { describe, expect, it } from "vitest";

import { xiaomiFormSchema } from "@/lib/validation/xiaomi";

const valid = {
  model: "Redmi Note 13",
  storage: "128GB",
  color: "Preto",
  type: "new",
  origin: "distributor",
  acquisitionCost: "900",
  repairCost: "0",
  quantity: "5",
  purchaseDate: "2026-09-20",
};

describe("xiaomiFormSchema", () => {
  it("accepts a batch without IMEI", () => {
    const result = xiaomiFormSchema.safeParse(valid);
    expect(result.success && result.data.quantity).toBe(5);
  });

  it("only takes the listed storage options", () => {
    expect(xiaomiFormSchema.safeParse({ ...valid, storage: "1TB" }).success).toBe(false);
  });

  it("requires a model and a positive cost", () => {
    expect(xiaomiFormSchema.safeParse({ ...valid, model: "" }).success).toBe(false);
    expect(xiaomiFormSchema.safeParse({ ...valid, acquisitionCost: "0" }).success).toBe(false);
  });
});
