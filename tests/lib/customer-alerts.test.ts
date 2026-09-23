import { describe, it, expect } from "vitest";

import { isInUpgradeWindow, isBirthdayWithinDays, daysInStock, nextBirthday } from "@/lib/customer-alerts";

describe("isInUpgradeWindow", () => {
  it("is true when the last sale was at least N months ago", () => {
    const now = new Date("2026-09-23T00:00:00Z");
    expect(isInUpgradeWindow("2025-01-01", 20, now)).toBe(true);
  });
  it("is false when the last sale is within the window", () => {
    const now = new Date("2026-09-23T00:00:00Z");
    expect(isInUpgradeWindow("2026-08-01", 20, now)).toBe(false);
  });
  it("is false when there is no last sale (no purchases yet)", () => {
    expect(isInUpgradeWindow(null, 20)).toBe(false);
  });
  it("clamps a month-end last sale date instead of overflowing into the next month", () => {
    // Jan 31 + 1 month must resolve to Feb 28 (2026 is not a leap year), not "Feb 31" -> March 3.
    const now = new Date("2026-03-01T00:00:00Z");
    expect(isInUpgradeWindow("2026-01-31", 1, now)).toBe(true);
  });
});

describe("nextBirthday", () => {
  it("returns this year's date when it hasn't passed yet", () => {
    const now = new Date("2026-09-23T00:00:00Z");
    expect(nextBirthday("1990-09-25", now).toISOString().slice(0, 10)).toBe("2026-09-25");
  });
  it("returns next year's date when it already passed", () => {
    const now = new Date("2026-09-23T00:00:00Z");
    expect(nextBirthday("1990-01-01", now).toISOString().slice(0, 10)).toBe("2027-01-01");
  });
  it("clamps a Feb 29 birthdate to Feb 28 in a non-leap year", () => {
    const now = new Date("2026-09-23T00:00:00Z");
    expect(nextBirthday("1992-02-29", now).toISOString().slice(0, 10)).toBe("2027-02-28");
  });
});

describe("isBirthdayWithinDays", () => {
  it("is true when the birthday falls within the next N days, ignoring year", () => {
    const now = new Date("2026-09-23T00:00:00Z");
    expect(isBirthdayWithinDays("1990-09-25", 7, now)).toBe(true);
  });
  it("is true when the birthday wraps around year-end", () => {
    const now = new Date("2026-12-29T00:00:00Z");
    expect(isBirthdayWithinDays("1985-01-02", 7, now)).toBe(true);
  });
  it("is false when there is no birthdate on file", () => {
    expect(isBirthdayWithinDays(null, 7)).toBe(false);
  });
  it("is false when the birthday already passed this cycle", () => {
    const now = new Date("2026-09-23T00:00:00Z");
    expect(isBirthdayWithinDays("1990-09-01", 7, now)).toBe(false);
  });
});

describe("daysInStock", () => {
  it("counts whole days since the purchase date", () => {
    const now = new Date("2026-09-23T00:00:00Z");
    expect(daysInStock("2026-09-10", now)).toBe(13);
  });
  it("returns 0 for a purchase made today", () => {
    const now = new Date("2026-09-23T12:00:00Z");
    expect(daysInStock("2026-09-23", now)).toBe(0);
  });
});
