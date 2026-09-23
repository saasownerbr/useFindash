import { describe, expect, it } from "vitest";

import {
  DEFAULT_MULTIPLIERS,
  EMPTY_ANSWERS,
  computePricing,
  computeScore,
  gradeFromScore,
  isValidImei,
  suggestedRepairs,
  type CheckupAnswers,
} from "@/lib/used-device-calculator";

const perfect: CheckupAnswers = {
  screen: "genuine_flawless",
  battery: "genuine_above_90",
  biometrics: "working",
  camera: "all_working",
  body: "intact",
  icloud: "removed",
  service: "original",
};

describe("computeScore", () => {
  it("sums the five scored categories (max 95)", () => {
    const result = computeScore(perfect);
    expect(result.score).toBe(95);
    expect(result.complete).toBe(true);
    expect(result.blocked).toBe(false);
  });

  it("subtracts 5 points for third-party parts", () => {
    expect(computeScore({ ...perfect, service: "third_party" }).score).toBe(90);
  });

  it("never goes below zero", () => {
    const worst: CheckupAnswers = {
      screen: "cracked_unusable",
      battery: "below_80",
      biometrics: "broken",
      camera: "broken",
      body: "heavy_dent",
      icloud: "removed",
      service: "third_party",
    };
    expect(computeScore(worst).score).toBe(0);
  });

  it("reports partial progress and iCloud blocking", () => {
    const result = computeScore({ ...EMPTY_ANSWERS, screen: "genuine_flawless", icloud: "active" });
    expect(result.answered).toBe(2);
    expect(result.complete).toBe(false);
    expect(result.blocked).toBe(true);
  });
});

describe("gradeFromScore", () => {
  it("maps score bands to grades", () => {
    expect(gradeFromScore(95)).toBe("A+");
    expect(gradeFromScore(90)).toBe("A+");
    expect(gradeFromScore(89)).toBe("A");
    expect(gradeFromScore(75)).toBe("A");
    expect(gradeFromScore(74)).toBe("B");
    expect(gradeFromScore(55)).toBe("B");
    expect(gradeFromScore(54)).toBe("C");
    expect(gradeFromScore(35)).toBe("C");
    expect(gradeFromScore(34)).toBe("sucata");
  });
});

describe("suggestedRepairs", () => {
  it("suggests nothing for a perfect device", () => {
    expect(suggestedRepairs(perfect, 95)).toEqual([]);
  });

  it("suggests screen, battery, biometrics and camera repairs from the answers", () => {
    expect(
      suggestedRepairs(
        { ...perfect, screen: "aftermarket_ok", battery: "below_80", biometrics: "intermittent", camera: "broken" },
        null
      )
    ).toEqual(["screen", "battery", "biometrics", "camera"]);
  });

  it("suggests a battery swap when the typed percentage is below 80", () => {
    expect(suggestedRepairs(perfect, 78)).toEqual(["battery"]);
  });

  it("does not treat a lens scratch as a camera repair", () => {
    expect(suggestedRepairs({ ...perfect, camera: "lens_scratch" }, null)).toEqual([]);
  });
});

describe("computePricing", () => {
  it("applies the grade multiplier, repairs and minimum margin", () => {
    const result = computePricing({
      referencePrice: 5000,
      grade: "A",
      multipliers: DEFAULT_MULTIPLIERS,
      repairTotal: 300,
      minMargin: 0.2,
      offerPrice: null,
    });
    expect(result.multiplier).toBe(0.82);
    expect(result.resalePrice).toBeCloseTo(4100);
    // 4100 - 300 - 820
    expect(result.maxPurchaseCost).toBeCloseTo(2980);
    expect(result.marginValue).toBeCloseTo(820);
    expect(result.marginPercent).toBeCloseTo(0.2);
  });

  it("estimates the margin from the offered price when given", () => {
    const result = computePricing({
      referencePrice: 5000,
      grade: "A",
      multipliers: DEFAULT_MULTIPLIERS,
      repairTotal: 300,
      minMargin: 0.2,
      offerPrice: 2500,
    });
    expect(result.marginValue).toBeCloseTo(1300);
    expect(result.marginPercent).toBeCloseTo(1300 / 4100);
  });

  it("gives zero resale value for scrap", () => {
    const result = computePricing({
      referencePrice: 5000,
      grade: "sucata",
      multipliers: DEFAULT_MULTIPLIERS,
      repairTotal: 0,
      minMargin: 0.2,
      offerPrice: null,
    });
    expect(result.resalePrice).toBe(0);
    expect(result.maxPurchaseCost).toBe(0);
  });
});

describe("isValidImei", () => {
  it("accepts an IMEI with a valid check digit", () => {
    expect(isValidImei("490154203237518")).toBe(true);
  });

  it("rejects a wrong check digit or wrong length", () => {
    expect(isValidImei("490154203237519")).toBe(false);
    expect(isValidImei("49015420323751")).toBe(false);
  });
});
