import { describe, expect, it } from "vitest";

import { goalPace } from "@/lib/revenue-goal";

// September has 30 days; the 10th leaves 21 days counting today.
const SEPT_10 = new Date(2026, 8, 10, 12);

describe("goalPace", () => {
  it("computes progress, daily need and projection", () => {
    const pace = goalPace(20000, 100000, SEPT_10);
    expect(pace.percentage).toBe(20);
    expect(pace.remaining).toBe(80000);
    expect(pace.daysLeft).toBe(21);
    expect(pace.dailyNeeded).toBeCloseTo(80000 / 21);
    expect(pace.projection).toBe(60000);
  });

  it("caps progress and zeroes the daily need once the goal is hit", () => {
    const pace = goalPace(150000, 100000, SEPT_10);
    expect(pace.percentage).toBe(100);
    expect(pace.dailyNeeded).toBe(0);
  });

  it("handles a missing goal", () => {
    expect(goalPace(1000, 0, SEPT_10).percentage).toBe(0);
  });
});
