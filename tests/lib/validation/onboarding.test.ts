import { describe, expect, it } from "vitest";

import { onboardingSchema } from "@/lib/validation/onboarding";

describe("onboardingSchema", () => {
  it("accepts a valid store name and goal", () => {
    const result = onboardingSchema.safeParse({ storeName: "iStore Centro", monthlyRevenueGoal: 50000 });
    expect(result.success).toBe(true);
  });

  it("rejects a store name shorter than 2 characters", () => {
    expect(onboardingSchema.safeParse({ storeName: "a", monthlyRevenueGoal: 0 }).success).toBe(false);
  });

  it("rejects a negative goal", () => {
    expect(onboardingSchema.safeParse({ storeName: "iStore", monthlyRevenueGoal: -1 }).success).toBe(false);
  });

  it("coerces a numeric string goal", () => {
    const result = onboardingSchema.safeParse({ storeName: "iStore", monthlyRevenueGoal: "1000" });
    expect(result.success).toBe(true);
  });
});
