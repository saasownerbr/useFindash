import { describe, expect, it } from "vitest";

import { presetRange } from "@/lib/period-filter-store";

const NOW = new Date(2026, 8, 24, 14, 30); // 24 Sep 2026, 14:30 local

describe("presetRange", () => {
  it("covers the whole current month for 'Este mês', not only the days so far", () => {
    const { start, end } = presetRange("month", NOW);
    expect(start).toEqual(new Date(2026, 8, 1));
    expect(end).toEqual(new Date(2026, 8, 30, 23, 59, 59, 999));
  });

  it("runs 'Hoje' from midnight to the end of the day", () => {
    const { start, end } = presetRange("today", NOW);
    expect(start).toEqual(new Date(2026, 8, 24));
    expect(end).toEqual(new Date(2026, 8, 24, 23, 59, 59, 999));
  });

  it("spans 15 and 90 days counting today", () => {
    expect(presetRange("15days", NOW).start).toEqual(new Date(2026, 8, 10));
    expect(presetRange("90days", NOW).start).toEqual(new Date(2026, 5, 27));
  });
});
