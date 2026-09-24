import { describe, it, expect } from "vitest";

import { alertSettingsSchema, storeProfileSchema } from "@/lib/validation/store-settings";

describe("storeProfileSchema", () => {
  it("rejects monthly_revenue_goal of zero", () => {
    expect(storeProfileSchema.safeParse({ name: "Test Store", monthly_revenue_goal: 0 }).success).toBe(false);
  });

  it("rejects negative monthly_revenue_goal", () => {
    expect(storeProfileSchema.safeParse({ name: "Test Store", monthly_revenue_goal: -1000 }).success).toBe(false);
  });

  it("accepts positive monthly_revenue_goal", () => {
    expect(storeProfileSchema.safeParse({ name: "Test Store", monthly_revenue_goal: 50000 }).success).toBe(true);
  });

  it("error message for zero goal is clear", () => {
    const result = storeProfileSchema.safeParse({ name: "Test Store", monthly_revenue_goal: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.monthly_revenue_goal?.[0]).toContain("maior que zero");
    }
  });

  it("rejects an empty store name", () => {
    expect(storeProfileSchema.safeParse({ name: "  ", monthly_revenue_goal: 1000 }).success).toBe(false);
  });
});

describe("alertSettingsSchema", () => {
  it("accepts whole positive numbers", () => {
    expect(alertSettingsSchema.safeParse({ stock_alert_days: "30", upgrade_alert_months: "20" }).success).toBe(true);
  });

  it("rejects zero and fractions", () => {
    expect(alertSettingsSchema.safeParse({ stock_alert_days: 0, upgrade_alert_months: 20 }).success).toBe(false);
    expect(alertSettingsSchema.safeParse({ stock_alert_days: 30, upgrade_alert_months: 1.5 }).success).toBe(false);
  });
});
