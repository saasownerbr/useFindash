import { describe, expect, it } from "vitest";

import { COST_TYPES, DESCRIPTION_PLACEHOLDERS, costEntrySchema } from "@/lib/validation/cost-entry";

const base = { amount: 100, date: "2026-09-10" };

describe("costEntrySchema", () => {
  it("accepts any free-text description", () => {
    expect(costEntrySchema.safeParse({ ...base, type: "fixed", description: "Conta de luz de setembro" }).success).toBe(true);
  });

  it("requires a description for non-marketing types", () => {
    expect(costEntrySchema.safeParse({ ...base, type: "supplier", description: "  " }).success).toBe(false);
  });

  it("lets marketing go without a description", () => {
    expect(costEntrySchema.safeParse({ ...base, type: "marketing", description: "" }).success).toBe(true);
  });
});

describe("DESCRIPTION_PLACEHOLDERS", () => {
  it("has a hint for every type", () => {
    expect(COST_TYPES.every((t) => DESCRIPTION_PLACEHOLDERS[t].length > 0)).toBe(true);
  });
});
