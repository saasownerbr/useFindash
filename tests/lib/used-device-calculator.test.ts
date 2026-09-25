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

  it("goes negative when serious defects pile up", () => {
    const worst: CheckupAnswers = {
      screen: "cracked_unusable",
      battery: "below_80",
      biometrics: "broken",
      camera: "broken",
      body: "heavy_dent",
      icloud: "removed",
      service: "third_party",
    };
    // -15 -10 -20 -15 -20 - 5 of third-party parts
    expect(computeScore(worst).score).toBe(-85);
    expect(computeScore(worst).critical).toBe(true);
  });

  it("subtracts points for each serious defect", () => {
    expect(computeScore({ ...perfect, screen: "cracked_unusable" }).score).toBe(50);
    expect(computeScore({ ...perfect, battery: "below_80" }).score).toBe(60);
    expect(computeScore({ ...perfect, biometrics: "broken" }).score).toBe(55);
    expect(computeScore({ ...perfect, camera: "broken" }).score).toBe(68);
    expect(computeScore({ ...perfect, body: "heavy_dent" }).score).toBe(67);
  });

  it("scores a flawless device with a heavy dent at 67, grade B", () => {
    // 30 screen + 25 battery + 20 biometrics + 12 cameras - 20 heavy dent
    const result = computeScore({ ...perfect, body: "heavy_dent" });
    expect(result.score).toBe(67);
    expect(gradeFromScore(result.score)).toBe("B");
    expect(result.critical).toBe(false);
  });

  it("does not flag critical damage before the checkup is finished", () => {
    expect(computeScore(EMPTY_ANSWERS).critical).toBe(false);
  });

  it("takes 50 points off an active iCloud account on top of blocking it", () => {
    const result = computeScore({ ...perfect, icloud: "active" });
    expect(result.score).toBe(45);
    expect(result.blocked).toBe(true);
  });

  it("flags critical damage below 10 points", () => {
    expect(computeScore({ ...perfect, screen: "cracked_unusable", biometrics: "broken", body: "heavy_dent" }).critical).toBe(true);
    expect(computeScore(perfect).critical).toBe(false);
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
    expect(gradeFromScore(-40)).toBe("sucata");
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
      repairTotal: 800,
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
