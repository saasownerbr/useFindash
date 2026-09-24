import { describe, expect, it } from "vitest";

import { percentChange, previousRange } from "@/lib/period";

describe("previousRange", () => {
  it("returns the window of the same length right before", () => {
    const prev = previousRange(new Date("2026-09-11T00:00:00Z"), new Date("2026-09-21T00:00:00Z"));
    expect(prev.start.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(prev.end.toISOString()).toBe("2026-09-11T00:00:00.000Z");
  });
});

describe("percentChange", () => {
  it("computes the relative change", () => {
    expect(percentChange(120, 100)).toBeCloseTo(0.2);
    expect(percentChange(80, 100)).toBeCloseTo(-0.2);
  });

  it("is signed by direction even from a negative base", () => {
    expect(percentChange(-50, -100)).toBeCloseTo(0.5);
  });

  it("returns null without a previous value", () => {
    expect(percentChange(100, 0)).toBeNull();
  });
});
