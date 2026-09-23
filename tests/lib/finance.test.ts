import { describe, it, expect } from "vitest";

import {
  calculateCMV,
  calculateGrossMargin,
  calculateNetMargin,
  calculateCAC,
  calculateROAS,
  calculateRetentionRate,
  formatCurrencyBRL,
} from "@/lib/finance";

describe("calculateCMV", () => {
  it("sums acquisition and repair cost across sales", () => {
    expect(
      calculateCMV([
        { acquisition_cost: 1000, repair_cost: 50 },
        { acquisition_cost: 2000, repair_cost: 0 },
      ])
    ).toBe(3050);
  });
  it("returns 0 for no sales", () => {
    expect(calculateCMV([])).toBe(0);
  });
});

describe("calculateGrossMargin", () => {
  it("sums the generated gross_margin column across sales", () => {
    expect(calculateGrossMargin([{ gross_margin: 500 }, { gross_margin: -100 }])).toBe(400);
  });
  it("returns 0 for no sales", () => {
    expect(calculateGrossMargin([])).toBe(0);
  });
  it("treats a null gross_margin as 0", () => {
    expect(calculateGrossMargin([{ gross_margin: null }, { gross_margin: 200 }])).toBe(200);
  });
});

describe("calculateNetMargin", () => {
  it("subtracts all cost entries and commissions from gross margin", () => {
    expect(calculateNetMargin(1000, [{ amount: 200 }, { amount: 100 }], 150)).toBe(550);
  });
  it("handles zero cost entries and zero commissions", () => {
    expect(calculateNetMargin(1000, [], 0)).toBe(1000);
  });
});

describe("calculateCAC", () => {
  it("divides investment by number of paid-traffic sales", () => {
    expect(calculateCAC(1000, 4)).toBe(250);
  });
  it("returns 0 when there were no paid-traffic sales, not Infinity/NaN", () => {
    expect(calculateCAC(1000, 0)).toBe(0);
  });
  it("returns 0 for organic channels regardless of sale count", () => {
    expect(calculateCAC(0, 10)).toBe(0);
  });
});

describe("calculateROAS", () => {
  it("divides paid-traffic revenue by investment", () => {
    expect(calculateROAS(4000, 1000)).toBe(4);
  });
  it("returns 0 when investment is 0, not Infinity/NaN", () => {
    expect(calculateROAS(4000, 0)).toBe(0);
  });
});

describe("calculateRetentionRate", () => {
  it("is the fraction of customers with more than one sale in the period", () => {
    expect(
      calculateRetentionRate([
        { salesCountInPeriod: 2 },
        { salesCountInPeriod: 1 },
        { salesCountInPeriod: 3 },
        { salesCountInPeriod: 1 },
      ])
    ).toBe(0.5);
  });
  it("returns 0 when there are no customers with sales in the period, not NaN", () => {
    expect(calculateRetentionRate([])).toBe(0);
  });
});

describe("formatCurrencyBRL", () => {
  it("formats a number as BRL currency", () => {
    expect(formatCurrencyBRL(1234.5)).toBe("R$ 1.234,50");
  });
  it("formats zero", () => {
    expect(formatCurrencyBRL(0)).toBe("R$ 0,00");
  });
});
