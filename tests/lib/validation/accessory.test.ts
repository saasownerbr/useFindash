import { describe, expect, it } from "vitest";

import { ACCESSORY_CATEGORIES, accessorySchema } from "@/lib/validation/accessory";

describe("accessorySchema", () => {
  const valid = { name: "Capinha transparente", category: "Capinha", quantity: 10, cost: 5, salePrice: 25 };

  it("accepts valid accessory data", () => {
    expect(accessorySchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a name shorter than 2 characters", () => {
    expect(accessorySchema.safeParse({ ...valid, name: "a" }).success).toBe(false);
  });

  it("rejects a negative quantity", () => {
    expect(accessorySchema.safeParse({ ...valid, quantity: -1 }).success).toBe(false);
  });

  it("rejects a negative cost", () => {
    expect(accessorySchema.safeParse({ ...valid, cost: -1 }).success).toBe(false);
  });

  it("rejects a negative sale price", () => {
    expect(accessorySchema.safeParse({ ...valid, salePrice: -1 }).success).toBe(false);
  });

  it("coerces numeric strings", () => {
    const result = accessorySchema.safeParse({ ...valid, quantity: "10", cost: "5", salePrice: "25" });
    expect(result.success).toBe(true);
  });
});

describe("ACCESSORY_CATEGORIES", () => {
  it("covers the iPhone accessory niche with no duplicates", () => {
    expect(ACCESSORY_CATEGORIES).toContain("Capinha");
    expect(ACCESSORY_CATEGORIES).toContain("Carregador MagSafe");
    expect(new Set(ACCESSORY_CATEGORIES).size).toBe(ACCESSORY_CATEGORIES.length);
  });
});
