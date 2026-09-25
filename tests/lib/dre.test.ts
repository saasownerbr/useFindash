import { describe, it, expect } from "vitest";

import { buildDRE, NO_COSTS, periodCosts, type CostEntryForPeriod } from "@/lib/dre";
import { presetRange } from "@/lib/period-filter-store";

describe("buildDRE", () => {
  it("computes every DRE line; supplier purchases are shown but not subtracted again", () => {
    const dre = buildDRE(
      [
        { acquisition_cost: 1000, repair_cost: 50, gross_margin: 450, commission_amount: 45 },
        { acquisition_cost: 2000, repair_cost: 0, gross_margin: 500, commission_amount: 50 },
      ],
      { fixed: 300, variable: 100, marketing: 200, supplier: 50 }
    );
    expect(dre.revenue).toBe(950 + 3050);
    expect(dre.cmv).toBe(3050);
    expect(dre.grossMargin).toBe(950);
    expect(dre.commissions).toBe(95);
    expect(dre.costsByType).toEqual({ fixed: 300, variable: 100, marketing: 200, supplier: 50 });
    expect(dre.netMargin).toBe(950 - 300 - 100 - 200 - 95);
  });

  it("returns all zeros for an empty month, never NaN", () => {
    const dre = buildDRE([], NO_COSTS);
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
    const dre = buildDRE([{ acquisition_cost: 100, repair_cost: 0, gross_margin: 50, commission_amount: null }], NO_COSTS);
    expect(dre.commissions).toBe(0);
  });

  it("includes accessory-only revenue and cost, not just device sales", () => {
    // An accessory-only sale has no device leg (empty sales array) but still
    // has real revenue/cost from sale_accessories — must not report as R$ 0.
    const dre = buildDRE([], NO_COSTS, { revenue: 200, cost: 80 });
    expect(dre.revenue).toBe(200);
    expect(dre.cmv).toBe(80);
    expect(dre.grossMargin).toBe(120);
  });

  it("adds accessory revenue/cost on top of a device sale in the same month", () => {
    const dre = buildDRE(
      [{ acquisition_cost: 1000, repair_cost: 0, gross_margin: 500, commission_amount: 0 }],
      NO_COSTS,
      { revenue: 100, cost: 40 }
    );
    expect(dre.revenue).toBe(1500 + 100);
    expect(dre.cmv).toBe(1000 + 40);
    expect(dre.grossMargin).toBe(500 + 60);
  });
});

// A September with R$ 3.000 of fixed costs (rent on the 1st), variable costs on two days, a stock purchase.
const SEPTEMBER: CostEntryForPeriod[] = [
  { type: "fixed", amount: 3000, date: "2026-09-01" },
  { type: "variable", amount: 120, date: "2026-09-24" },
  { type: "variable", amount: 80, date: "2026-09-10" },
  { type: "supplier", amount: 20000, date: "2026-09-24" },
];
const NOW = new Date(2026, 8, 24, 15, 0); // 24 Sep 2026, 15:00

describe("periodCosts", () => {
  it("'Hoje' carries 1/30 of the month's fixed costs and only today's variable costs", () => {
    const { start, end } = presetRange("today", NOW);
    expect(periodCosts(SEPTEMBER, start, end)).toEqual({ fixed: 100, variable: 120, marketing: 0, supplier: 20000 });
  });

  it("'15 dias' carries 15/30 of the fixed costs even when the rent was entered outside the window", () => {
    const { start, end } = presetRange("15days", NOW); // 10 to 24 Sep
    const costs = periodCosts(SEPTEMBER, start, end);
    expect(costs.fixed).toBe(1500);
    expect(costs.variable).toBe(200);
  });

  it("'Este mês' runs to today but carries 100% of the month's fixed costs, like the monthly DRE", () => {
    const { start, end } = presetRange("month", NOW);
    expect(periodCosts(SEPTEMBER, start, end, { wholeMonths: true })).toEqual({ fixed: 3000, variable: 200, marketing: 0, supplier: 20000 });
    // Without the option the same 1-24 Sep window would be prorated (24/30).
    expect(periodCosts(SEPTEMBER, start, end).fixed).toBe(2400);
  });

  it("'15 dias' across two months prorates each month's own fixed costs", () => {
    const entries: CostEntryForPeriod[] = [
      { type: "fixed", amount: 10000, date: "2026-09-01" },
      { type: "fixed", amount: 8000, date: "2026-10-01" },
    ];
    const { start, end } = presetRange("15days", new Date(2026, 9, 2, 10, 0)); // 18 Sep to 2 Oct
    // 13 days of September (13/30 × 10.000 = 4.333,33) + 2 days of October (2/30 × 8.000 = 533,33).
    expect(periodCosts(entries, start, end).fixed).toBeCloseTo(4866.67, 2);
  });

  it("counts a whole short month as 100% (February has 28 days)", () => {
    const feb = [{ type: "fixed" as const, amount: 2800, date: "2026-02-01" }];
    expect(periodCosts(feb, new Date(2026, 1, 1), new Date(2026, 1, 28, 23, 59)).fixed).toBe(2800);
  });

  it("'90 dias' adds about three months of fixed costs, each month at its own value", () => {
    const entries: CostEntryForPeriod[] = [
      { type: "fixed", amount: 3000, date: "2026-06-05" },
      { type: "fixed", amount: 3000, date: "2026-07-05" },
      { type: "fixed", amount: 3000, date: "2026-08-05" },
      { type: "fixed", amount: 3000, date: "2026-09-05" },
    ];
    const { start, end } = presetRange("90days", NOW); // 27 Jun to 24 Sep
    // Jun 27-30: 4/30, Jul and Aug whole, Sep 1-24: 24/30.
    expect(periodCosts(entries, start, end).fixed).toBeCloseTo(3000 * (4 / 30) + 3000 + 3000 + 3000 * (24 / 30));
  });
});

describe("dashboard 'Hoje' scenario", () => {
  it("a R$ 5.000 sale with R$ 3.500 of CMV shows R$ 1.500 gross (30%) and a positive net margin", () => {
    const { start, end } = presetRange("today", NOW);
    const sale = { acquisition_cost: 3500, repair_cost: 0, gross_margin: 1500, commission_amount: 0 };
    const dre = buildDRE([sale], periodCosts(SEPTEMBER, start, end));
    expect(dre.revenue).toBe(5000);
    expect(dre.cmv).toBe(3500);
    expect(dre.grossMargin).toBe(1500);
    expect(dre.grossMarginPct).toBeCloseTo(0.3);
    // 1.500 − 100 of rent for the day − 120 of today's variable costs; the R$ 20.000 stock purchase is not subtracted.
    expect(dre.netMargin).toBe(1280);
  });
});
