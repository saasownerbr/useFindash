import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

import { subscriptionUpdateForEvent } from "@/lib/subscription";

const NOW = new Date("2026-09-25T12:00:00Z");
const base = { status: "pending", asaas_payment_id: null, asaas_subscription_id: "sub_1", trial_end: null };

describe("subscriptionUpdateForEvent", () => {
  it("activates a monthly plan for 30 days on payment", () => {
    const update = subscriptionUpdateForEvent({ event: "PAYMENT_CONFIRMED", payment: { id: "pay_1" } }, base, "monthly", NOW);
    expect(update).toMatchObject({ status: "active", asaas_payment_id: "pay_1", current_period_end: "2026-10-25T12:00:00.000Z" });
  });

  it("activates an annual plan for 365 days on payment", () => {
    const update = subscriptionUpdateForEvent(
      { event: "PAYMENT_RECEIVED", payment: { id: "pay_a" } },
      { ...base, asaas_subscription_id: null, asaas_payment_id: "pay_a" },
      "annual",
      NOW
    );
    expect(update).toMatchObject({ status: "active", current_period_end: "2027-09-25T12:00:00.000Z" });
  });

  it("does not extend twice for CONFIRMED then RECEIVED of the same charge", () => {
    const active = { ...base, status: "active", asaas_payment_id: "pay_1" };
    expect(subscriptionUpdateForEvent({ event: "PAYMENT_RECEIVED", payment: { id: "pay_1" } }, active, "monthly", NOW)).toBeNull();
    expect(subscriptionUpdateForEvent({ event: "PAYMENT_RECEIVED", payment: { id: "pay_2" } }, active, "monthly", NOW)).toMatchObject({
      status: "active",
    });
  });

  it("marks a paying store overdue, but not an abandoned first checkout", () => {
    expect(subscriptionUpdateForEvent({ event: "PAYMENT_OVERDUE", payment: { id: "p" } }, { ...base, status: "active" }, "monthly", NOW)).toMatchObject({
      status: "overdue",
    });
    expect(subscriptionUpdateForEvent({ event: "PAYMENT_OVERDUE", payment: { id: "p" } }, base, "monthly", NOW)).toBeNull();
  });

  it("cancels on subscription inactivated or deleted", () => {
    for (const event of ["SUBSCRIPTION_INACTIVATED", "SUBSCRIPTION_DELETED"]) {
      expect(subscriptionUpdateForEvent({ event, subscription: { id: "sub_1" } }, { ...base, status: "active" }, "monthly", NOW)).toMatchObject({
        status: "cancelled",
      });
    }
  });

  it("cancels a deleted pending annual charge, returning to the trial if it is still running", () => {
    const annual = { ...base, asaas_subscription_id: null, asaas_payment_id: "pay_a" };
    expect(subscriptionUpdateForEvent({ event: "PAYMENT_DELETED", payment: { id: "pay_a" } }, annual, "annual", NOW)).toMatchObject({
      status: "cancelled",
    });
    expect(
      subscriptionUpdateForEvent({ event: "PAYMENT_DELETED", payment: { id: "pay_a" } }, { ...annual, trial_end: "2026-09-28T00:00:00Z" }, "annual", NOW)
    ).toMatchObject({ status: "trial" });
    expect(subscriptionUpdateForEvent({ event: "PAYMENT_DELETED", payment: { id: "other" } }, annual, "annual", NOW)).toBeNull();
  });

  it("ignores other events", () => {
    expect(subscriptionUpdateForEvent({ event: "PAYMENT_CREATED", payment: { id: "p" } }, base, "monthly", NOW)).toBeNull();
  });
});

describe("checkAccess", () => {
  it("gives the owner full access without reading the subscription", async () => {
    const { checkAccess } = await import("@/lib/subscription");
    const from = vi.fn();
    const supabase = { from } as never;
    expect(await checkAccess("u1", supabase, "luanuliana8@gmail.com")).toEqual({ access: "full", type: "owner" });
    expect(from).not.toHaveBeenCalled();
  });
});
