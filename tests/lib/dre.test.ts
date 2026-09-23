import { describe, it, expect } from "vitest";

import { buildDRE } from "@/lib/dre";

describe("buildDRE", () => {
  it("computes every DRE line from sales and cost entries", () => {
    const dre = buildDRE(
      [
        { acquisition_cost: 1000, repair_cost: 50, gross_margin: 450, commission_amount: 45 },
        { acquisition_cost: 2000, repair_cost: 0, gross_margin: 500, commission_amount: 50 },
      ],
      [
        { type: "fixed", amount: 300 },
        { type: "variable", amount: 100 },
        { type: "marketing", amount: 200 },
        { type: "supplier", amount: 50 },
      ]
    );
    expect(dre.revenue).toBe(950 + 3050);
    expect(dre.cmv).toBe(3050);
    expect(dre.grossMargin).toBe(950);
    expect(dre.commissions).toBe(95);
    expect(dre.costsByType).toEqual({ fixed: 300, variable: 100, marketing: 200, supplier: 50 });
    expect(dre.netMargin).toBe(950 - 300 - 100 - 200 - 50 - 95);
  });

  it("returns all zeros for an empty month, never NaN", () => {
    const dre = buildDRE([], []);
    expect(dre).toEqual({
      revenue: 0,
      cmv: 0,
      grossMargin: 0,
      grossMarginPct: 0,
      commissions: 0,
      costsByType: { fixed: 0, variable: 0, marketing: 0, supplier: 0 },
      netMargin: 0,
    });
  });

  it("treats a null commission_amount as 0", () => {
    const dre = buildDRE([{ acquisition_cost: 100, repair_cost: 0, gross_margin: 50, commission_amount: null }], []);
    expect(dre.commissions).toBe(0);
  });
});
