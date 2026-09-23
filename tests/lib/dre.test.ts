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

  it("includes accessory-only revenue and cost, not just device sales", () => {
    // An accessory-only sale has no device leg (empty sales array) but still
    // has real revenue/cost from sale_accessories — must not report as R$ 0.
    const dre = buildDRE([], [], { revenue: 200, cost: 80 });
    expect(dre.revenue).toBe(200);
    expect(dre.cmv).toBe(80);
    expect(dre.grossMargin).toBe(120);
  });

  it("adds accessory revenue/cost on top of a device sale in the same month", () => {
    const dre = buildDRE(
      [{ acquisition_cost: 1000, repair_cost: 0, gross_margin: 500, commission_amount: 0 }],
      [],
      { revenue: 100, cost: 40 }
    );
    expect(dre.revenue).toBe(1500 + 100);
    expect(dre.cmv).toBe(1000 + 40);
    expect(dre.grossMargin).toBe(500 + 60);
  });
});
