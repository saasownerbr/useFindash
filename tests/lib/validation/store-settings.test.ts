import { describe, it, expect } from "vitest";

import { storeSettingsSchema } from "@/lib/validation/store-settings";

describe("storeSettingsSchema", () => {
  it("rejects monthly_revenue_goal of zero", () => {
    const result = storeSettingsSchema.safeParse({
      name: "Test Store",
      monthly_revenue_goal: 0,
      stock_alert_days: 30,
      upgrade_alert_months: 20,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative monthly_revenue_goal", () => {
    const result = storeSettingsSchema.safeParse({
      name: "Test Store",
      monthly_revenue_goal: -1000,
      stock_alert_days: 30,
      upgrade_alert_months: 20,
    });
    expect(result.success).toBe(false);
  });

  it("accepts positive monthly_revenue_goal", () => {
    const result = storeSettingsSchema.safeParse({
      name: "Test Store",
      monthly_revenue_goal: 50000,
      stock_alert_days: 30,
      upgrade_alert_months: 20,
    });
    expect(result.success).toBe(true);
  });

  it("error message for zero goal is clear", () => {
    const result = storeSettingsSchema.safeParse({
      name: "Test Store",
      monthly_revenue_goal: 0,
      stock_alert_days: 30,
      upgrade_alert_months: 20,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.monthly_revenue_goal?.[0]).toContain("maior que zero");
    }
  });
});
