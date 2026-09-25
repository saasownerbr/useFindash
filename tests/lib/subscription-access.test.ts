import { describe, expect, it } from "vitest";

import { evaluateAccess, fullAccessUntil, isOwnerEmail, requiresAccessCheck } from "@/lib/subscription-access";

const NOW = new Date("2026-09-25T12:00:00Z");
const days = (n: number) => new Date(NOW.getTime() + n * 86_400_000).toISOString();
const sub = (fields: Partial<Parameters<typeof evaluateAccess>[0] & object>) => ({
  status: "trial",
  trial_end: null,
  current_period_end: null,
  updated_at: null,
  ...fields,
});

describe("evaluateAccess", () => {
  it("blocks a store without a subscription", () => {
    expect(evaluateAccess(null, NOW)).toEqual({ access: "blocked" });
  });

  it("gives full trial access with the days left while the trial runs", () => {
    expect(evaluateAccess(sub({ trial_end: days(6.5) }), NOW)).toMatchObject({ access: "full", type: "trial", daysLeft: 7 });
    expect(evaluateAccess(sub({ trial_end: days(0.2) }), NOW)).toMatchObject({ daysLeft: 1 });
  });

  it("blocks an ended trial", () => {
    expect(evaluateAccess(sub({ trial_end: days(-1) }), NOW)).toEqual({ access: "blocked" });
  });

  it("keeps the trial running while a checkout is pending, then blocks", () => {
    expect(evaluateAccess(sub({ status: "pending", trial_end: days(2) }), NOW)).toMatchObject({ type: "trial" });
    expect(evaluateAccess(sub({ status: "pending", trial_end: days(-2), current_period_end: days(-2) }), NOW)).toEqual({
      access: "blocked",
    });
  });

  it("gives paid access to an active plan, with a few days of grace past its end", () => {
    expect(evaluateAccess(sub({ status: "active", current_period_end: days(20) }), NOW)).toMatchObject({
      access: "full",
      type: "paid",
    });
    expect(evaluateAccess(sub({ status: "active", current_period_end: days(-1) }), NOW)).toMatchObject({ access: "full" });
    expect(evaluateAccess(sub({ status: "active", current_period_end: days(-4) }), NOW)).toEqual({ access: "blocked" });
  });

  it("warns for under 5 days overdue, then limits", () => {
    expect(evaluateAccess(sub({ status: "overdue", updated_at: days(-2) }), NOW)).toMatchObject({ access: "warning" });
    expect(evaluateAccess(sub({ status: "overdue", updated_at: days(-6) }), NOW)).toMatchObject({ access: "limited" });
  });

  it("blocks cancelled and expired", () => {
    expect(evaluateAccess(sub({ status: "cancelled", current_period_end: days(10) }), NOW)).toEqual({ access: "blocked" });
    expect(evaluateAccess(sub({ status: "expired" }), NOW)).toEqual({ access: "blocked" });
  });
});

describe("requiresAccessCheck", () => {
  it("checks app pages but never /planos, APIs or auth screens", () => {
    expect(requiresAccessCheck("/dashboard")).toBe(true);
    expect(requiresAccessCheck("/configuracoes")).toBe(true);
    expect(requiresAccessCheck("/planos")).toBe(false);
    expect(requiresAccessCheck("/api/subscription/monthly")).toBe(false);
    expect(requiresAccessCheck("/login")).toBe(false);
  });
});

describe("owner access", () => {
  it("recognizes the owner email regardless of case or spaces", () => {
    expect(isOwnerEmail("luanuliana8@gmail.com")).toBe(true);
    expect(isOwnerEmail(" LuanUliana8@Gmail.com ")).toBe(true);
    expect(isOwnerEmail("someone@gmail.com")).toBe(false);
    expect(isOwnerEmail(null)).toBe(false);
  });

  it("never caches the owner's access past the normal window", () => {
    expect(fullAccessUntil({ access: "full", type: "owner" })).toBeNull();
  });
});
