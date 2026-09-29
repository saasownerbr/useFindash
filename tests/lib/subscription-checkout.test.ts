import { beforeEach, describe, expect, it, vi } from "vitest";

const asaasFetch = vi.fn();
vi.mock("@/lib/asaas", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/asaas")>()),
  asaasFetch: (...args: unknown[]) => asaasFetch(...args),
  ensureCustomer: vi.fn(async () => "cus_1"),
}));

const upserts: unknown[] = [];
/** A query builder where every call chains and the terminal calls resolve to the table's canned row. */
function client(rows: Record<string, unknown>) {
  return {
    from(table: string) {
      const chain: Record<string, unknown> = {};
      for (const method of ["select", "eq", "order", "limit"]) chain[method] = () => chain;
      chain.maybeSingle = async () => ({ data: rows[table] ?? null });
      chain.upsert = async (row: unknown) => {
        upserts.push(row);
        return { error: null };
      };
      return chain;
    },
  };
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => client({ plans: { id: "plan_monthly", price: 197 }, subscriptions: null }),
}));

import { startCheckout } from "@/lib/subscription";

const userClient = client({
  store_users: { store_id: "store_1", role: "owner", stores: { name: "Loja", cnpj: "11.222.333/0001-81" } },
});

describe("startCheckout", () => {
  beforeEach(() => {
    process.env.ASAAS_API_KEY = "$aact_hmlg_test";
    asaasFetch.mockReset();
    upserts.length = 0;
  });

  it("charges the first month as a one-off payment and never creates the recurrence", async () => {
    asaasFetch.mockResolvedValue({ id: "pay_1", invoiceUrl: "https://asaas/i/pay_1" });

    const url = await startCheckout(userClient as never, { id: "user_1", email: "dono@loja.com" }, "monthly");

    expect(url).toBe("https://asaas/i/pay_1");
    expect(asaasFetch).toHaveBeenCalledTimes(1);
    const [path, options] = asaasFetch.mock.calls[0];
    expect(path).toBe("/payments");
    expect(JSON.parse(options.body)).toMatchObject({
      customer: "cus_1",
      billingType: "UNDEFINED",
      value: 197,
      description: "Plano Mensal useFindash — Primeiro mês",
      externalReference: "user_1",
    });
    expect(upserts[0]).toMatchObject({
      asaas_customer_id: "cus_1",
      asaas_payment_id: "pay_1",
      asaas_subscription_id: null,
      status: "pending",
      plan_id: "plan_monthly",
    });
  });
});
