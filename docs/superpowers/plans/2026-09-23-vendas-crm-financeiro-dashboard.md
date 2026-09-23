# Vendas, CRM, Financeiro, Dashboard, Rankings, Configurações e Crons — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build every remaining business module of useFindash (Clientes, Nova Venda, Financeiro, Dashboard, Rankings, Configurações) plus the three Vercel cron routes, wired to the existing Supabase schema, following the conventions established by the Estoque module, then deploy to production.

**Architecture:** Client components call the Supabase browser client directly (no server actions, no tRPC — matches Estoque). Multi-step writes that must be atomic (creating a sale that touches `sales`, `sale_accessories`, and `accessories.quantity` in one go) go through a new Postgres `security definer` RPC instead of sequential client calls. The one exception is seller invitation, which needs `auth.admin.inviteUserByEmail` and therefore a server-side Route Handler using the service-role key — the first non-cron API route in the app. Pure calculation logic (CMV, margins, CAC, ROAS, retention, upgrade/birthday window checks) lives in framework-free `lib/` modules with Vitest tests, then UI components call them — this isolates the money-math from React and lets it be tested the way the rest of `lib/` already is.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase (Postgres + RLS + Auth), Tailwind + shadcn/ui primitives already in `components/ui/`, react-hook-form + zod, Recharts, Zustand (wizard state), Vitest. Adds `sonner` for toasts (not yet installed).

**Spec:** `docs/superpowers/specs/2026-09-22-usefindash-saas-design.md` (sections 4–13). This plan implements execution-order steps 11–17 (Vendas, CRM, Financeiro, Dashboard, Rankings, Configurações, Crons), skipping step 10 (Checkup) which was not requested — semi-novo pricing until Checkup exists is whatever `final_price` was typed manually on the product form.

## Global Constraints

- `store_id` is always resolved via `getActiveStoreId(supabase, user.id)` from `lib/supabase/store.ts` — never trusted from route params or client state.
- No new UI design tokens — reuse `bg-background`, `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`, `bg-primary`/`text-primary`, `text-success`/`text-warning`/`text-danger` exactly as defined in `app/globals.css`/`tailwind.config.ts`.
- Every list follows the Estoque pattern: `data === null` → skeleton, `data.length === 0` → dashed empty-state box, debounced (300ms) filters with a generation-counter guard against out-of-order responses (see `components/estoque/product-list.tsx`).
- Every delete follows the row-count-after-delete check (`.select("id")`, treat 0 rows as a permission failure) — never trust `error === null` alone.
- Every form: `react-hook-form` + `zodResolver`, field errors inline under the field, submit failure sets `setError("root")`. In addition to inline errors, every successful create/update/delete now also fires a `sonner` toast (new — not yet used in Estoque; adding it here per this build's requirements) so action feedback isn't silent.
- `products.status` is never set to `'sold'` by client code — only the `mark_product_sold` trigger does that, fired by the new `create_sale` RPC's insert into `sales`.
- No billing/subscription logic. No IMEI lookup integration. No audit history or granular permissions beyond `owner`/`admin`/`seller`. No role-based UI hiding beyond what already exists — let RLS reject writes and surface the rejection inline, same as Estoque's delete pattern.
- Money fields are `numeric` in Postgres and arrive as `string` over the Supabase JS client — every calculation helper must `Number(...)` them before arithmetic and every display must format with `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- Commit after each task.

## Review Focus

- **Selling the last unit of an accessory while two tabs are open** — `create_sale` must lock and re-check `accessories.quantity` inside the transaction and raise, not go negative. (Task 2)
- **A sale with zero accessories and/or a null `product_id` (accessory-only sale)** — the wizard and the RPC must both accept an empty accessories array and a null product without crashing the margin/summary math. (Task 2, Task 7)
- **DRE/Rankings for a month with zero sales or zero cost entries** — every aggregate (CMV, margem, CAC, ticket médio, retention) must render `0`/`—`, never `NaN`, `Infinity`, or a thrown error from dividing by zero. (Task 3)
- **A customer with no purchases yet** — LTV shows `R$ 0,00`, no upgrade-window alert, profile timeline shows an empty state, not a crash on `sales[0]`. (Task 3, Task 5)
- **Cron endpoints hit without/with a wrong `Authorization` header** — must return 401 before touching the database, including when `CRON_SECRET` env var is unset. (Task 11)

---

## Existing conventions to reuse (read before starting)

- `lib/supabase/store.ts` → `getActiveStoreId(supabase, userId)`
- `components/estoque/product-list.tsx` → filter/debounce/skeleton/empty-state/delete pattern
- `components/estoque/product-form-dialog.tsx` → RHF + zod dialog pattern
- `components/confirm-dialog.tsx`, `components/ui/{badge,button,card,dialog,input,label,select}.tsx`
- `lib/validation/product.ts` → zod schema conventions (`z.coerce.number()`, `.trim()`, `superRefine`)
- `lib/navigation.ts` → routes already point at `/clientes`, `/vendas/nova` etc.; just add the missing `page.tsx` files.

---

### Task 1: Toast feedback (sonner)

**Files:**
- Modify: `package.json` (add `sonner`)
- Create: `components/ui/toaster.tsx`
- Modify: `app/(dashboard)/layout.tsx` (mount `<Toaster />`)
- Create: `lib/toast.ts`

**Interfaces:**
- Produces: `import { toast } from "@/lib/toast"` with `toast.success(message)`, `toast.error(message)` — every later task uses this, never `sonner` directly.

- [ ] **Step 1: Install sonner**

Run: `npm install sonner`

- [ ] **Step 2: Create the toaster mount and re-export**

`components/ui/toaster.tsx`:
```tsx
"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "bg-card border border-border text-foreground",
          success: "text-success",
          error: "text-danger",
        },
      }}
    />
  );
}
```

`lib/toast.ts`:
```ts
import { toast as sonnerToast } from "sonner";

export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
};
```

- [ ] **Step 3: Mount it once in the dashboard shell**

Modify `app/(dashboard)/layout.tsx`: import `{ Toaster } from "@/components/ui/toaster"` and render `<Toaster />` once alongside the existing `<Sidebar />`/`<main>` shell (sibling, not nested inside `<main>`).

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: succeeds with no new type errors.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json components/ui/toaster.tsx lib/toast.ts "app/(dashboard)/layout.tsx"
git commit -m "feat: add sonner toast feedback for dashboard actions"
```

---

### Task 2: `create_sale` RPC migration

**Files:**
- Create: `supabase/migrations/20260923100000_create_sale_rpc.sql`

**Interfaces:**
- Produces: Postgres function `public.create_sale(p_store_id uuid, p_customer_id uuid, p_seller_id uuid, p_product_id uuid, p_sale_channel text, p_sale_price numeric, p_payment_method text, p_installments integer, p_acquisition_cost numeric, p_repair_cost numeric, p_accessories jsonb) returns uuid`. `p_product_id` may be `null` (accessory-only sale). `p_accessories` is a JSON array of `{"accessory_id": uuid, "quantity": int, "unit_price": numeric}`, may be `[]`. Called from the client as `supabase.rpc("create_sale", { p_store_id, ... })`. Task 6 (Nova Venda) is the consumer.

- [ ] **Step 1: Write the migration**

```sql
create or replace function public.create_sale(
  p_store_id uuid,
  p_customer_id uuid,
  p_seller_id uuid,
  p_product_id uuid,
  p_sale_channel text,
  p_sale_price numeric,
  p_payment_method text,
  p_installments integer,
  p_acquisition_cost numeric,
  p_repair_cost numeric,
  p_accessories jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale_id uuid;
  v_commission_rate numeric;
  v_commission numeric;
  v_item jsonb;
  v_accessory_id uuid;
  v_qty integer;
  v_unit_price numeric;
  v_available integer;
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'not a member of this store';
  end if;

  select commission_rate into v_commission_rate
  from public.store_users
  where id = p_seller_id and store_id = p_store_id;

  if v_commission_rate is null then
    raise exception 'invalid seller for this store';
  end if;

  if p_product_id is not null then
    if not exists (
      select 1 from public.products
      where id = p_product_id and store_id = p_store_id and status = 'available'
    ) then
      raise exception 'product is not available for sale';
    end if;
  end if;

  v_commission := p_sale_price * v_commission_rate;

  insert into public.sales (
    store_id, customer_id, seller_id, product_id, sale_channel,
    sale_price, payment_method, installments, acquisition_cost, repair_cost,
    commission_amount
  ) values (
    p_store_id, p_customer_id, p_seller_id, p_product_id, p_sale_channel,
    p_sale_price, p_payment_method, coalesce(p_installments, 1), p_acquisition_cost, p_repair_cost,
    v_commission
  )
  returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(coalesce(p_accessories, '[]'::jsonb))
  loop
    v_accessory_id := (v_item->>'accessory_id')::uuid;
    v_qty := (v_item->>'quantity')::integer;
    v_unit_price := (v_item->>'unit_price')::numeric;

    if v_qty is null or v_qty <= 0 then
      raise exception 'invalid accessory quantity';
    end if;

    select quantity into v_available
    from public.accessories
    where id = v_accessory_id and store_id = p_store_id
    for update;

    if v_available is null then
      raise exception 'accessory not found in this store';
    end if;

    if v_available < v_qty then
      raise exception 'insufficient accessory stock';
    end if;

    insert into public.sale_accessories (sale_id, accessory_id, quantity, unit_price)
    values (v_sale_id, v_accessory_id, v_qty, v_unit_price);

    update public.accessories
    set quantity = quantity - v_qty
    where id = v_accessory_id;
  end loop;

  return v_sale_id;
end;
$$;

grant execute on function public.create_sale(
  uuid, uuid, uuid, uuid, text, numeric, text, integer, numeric, numeric, jsonb
) to authenticated;
```

- [ ] **Step 2: Apply the migration to the real Supabase project**

Run: `supabase db push`
Expected: migration applies cleanly (it's additive — only adds a function, no table changes).

- [ ] **Step 3: Smoke-test the RPC from the SQL editor or `supabase db execute`**

Verify a call with a fabricated store/customer/seller/product from an existing seeded row returns a uuid and that `sales`, `sale_accessories`, and `accessories.quantity` all update; verify calling it twice with more quantity than in stock raises `insufficient accessory stock` and leaves no partial rows (transaction rolled back).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260923100000_create_sale_rpc.sql
git commit -m "feat: add create_sale RPC for atomic sale + accessory stock writes"
```

---

### Task 3: Finance/CRM calculation library (pure logic, TDD)

**Files:**
- Create: `lib/finance.ts`
- Test: `tests/lib/finance.test.ts`
- Create: `lib/customer-alerts.ts`
- Test: `tests/lib/customer-alerts.test.ts`

**Interfaces:**
- Produces (`lib/finance.ts`): `calculateCMV(sales: {acquisition_cost: number; repair_cost: number}[]): number`, `calculateGrossMargin(sales: {gross_margin: number}[]): number`, `calculateNetMargin(grossMargin: number, costEntries: {amount: number}[], commissions: number): number`, `calculateCAC(paidTrafficInvestment: number, paidTrafficSalesCount: number): number`, `calculateROAS(paidTrafficRevenue: number, paidTrafficInvestment: number): number`, `calculateRetentionRate(customers: {salesCountInPeriod: number}[]): number`, `formatCurrencyBRL(value: number): string`.
- Produces (`lib/customer-alerts.ts`): `isInUpgradeWindow(lastSaleDate: string | null, upgradeAlertMonths: number, now?: Date): boolean`, `isBirthdayWithinDays(birthdate: string | null, days: number, now?: Date): boolean`, `daysInStock(purchaseDate: string, now?: Date): number`.
- Consumed by: Task 7 (Financeiro), Task 8 (Dashboard), Task 9 (Rankings), Task 5 (Clientes profile alerts), Task 11 (cron routes).

- [ ] **Step 1: Write failing tests for `lib/finance.ts`**

```ts
import { describe, it, expect } from "vitest";
import {
  calculateCMV,
  calculateGrossMargin,
  calculateNetMargin,
  calculateCAC,
  calculateROAS,
  calculateRetentionRate,
  formatCurrencyBRL,
} from "@/lib/finance";

describe("calculateCMV", () => {
  it("sums acquisition and repair cost across sales", () => {
    expect(calculateCMV([{ acquisition_cost: 1000, repair_cost: 50 }, { acquisition_cost: 2000, repair_cost: 0 }])).toBe(3050);
  });
  it("returns 0 for no sales", () => {
    expect(calculateCMV([])).toBe(0);
  });
});

describe("calculateGrossMargin", () => {
  it("sums the generated gross_margin column across sales", () => {
    expect(calculateGrossMargin([{ gross_margin: 500 }, { gross_margin: -100 }])).toBe(400);
  });
  it("returns 0 for no sales", () => {
    expect(calculateGrossMargin([])).toBe(0);
  });
});

describe("calculateNetMargin", () => {
  it("subtracts all cost entries and commissions from gross margin", () => {
    expect(calculateNetMargin(1000, [{ amount: 200 }, { amount: 100 }], 150)).toBe(550);
  });
  it("handles zero cost entries and zero commissions", () => {
    expect(calculateNetMargin(1000, [], 0)).toBe(1000);
  });
});

describe("calculateCAC", () => {
  it("divides investment by number of paid-traffic sales", () => {
    expect(calculateCAC(1000, 4)).toBe(250);
  });
  it("returns 0 when there were no paid-traffic sales, not Infinity/NaN", () => {
    expect(calculateCAC(1000, 0)).toBe(0);
  });
  it("returns 0 for organic channels regardless of sale count", () => {
    expect(calculateCAC(0, 10)).toBe(0);
  });
});

describe("calculateROAS", () => {
  it("divides paid-traffic revenue by investment", () => {
    expect(calculateROAS(4000, 1000)).toBe(4);
  });
  it("returns 0 when investment is 0, not Infinity/NaN", () => {
    expect(calculateROAS(4000, 0)).toBe(0);
  });
});

describe("calculateRetentionRate", () => {
  it("is the fraction of customers with more than one sale in the period", () => {
    expect(
      calculateRetentionRate([{ salesCountInPeriod: 2 }, { salesCountInPeriod: 1 }, { salesCountInPeriod: 3 }, { salesCountInPeriod: 1 }])
    ).toBe(0.5);
  });
  it("returns 0 when there are no customers with sales in the period, not NaN", () => {
    expect(calculateRetentionRate([])).toBe(0);
  });
});

describe("formatCurrencyBRL", () => {
  it("formats a number as BRL currency", () => {
    expect(formatCurrencyBRL(1234.5)).toBe("R$ 1.234,50");
  });
  it("formats zero", () => {
    expect(formatCurrencyBRL(0)).toBe("R$ 0,00");
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx vitest run tests/lib/finance.test.ts`
Expected: FAIL — `lib/finance.ts` does not exist yet.

- [ ] **Step 3: Implement `lib/finance.ts`**

```ts
export function calculateCMV(sales: { acquisition_cost: number; repair_cost: number }[]): number {
  return sales.reduce((sum, s) => sum + Number(s.acquisition_cost) + Number(s.repair_cost), 0);
}

export function calculateGrossMargin(sales: { gross_margin: number }[]): number {
  return sales.reduce((sum, s) => sum + Number(s.gross_margin), 0);
}

export function calculateNetMargin(
  grossMargin: number,
  costEntries: { amount: number }[],
  commissions: number
): number {
  const totalCosts = costEntries.reduce((sum, c) => sum + Number(c.amount), 0);
  return grossMargin - totalCosts - commissions;
}

export function calculateCAC(paidTrafficInvestment: number, paidTrafficSalesCount: number): number {
  if (paidTrafficSalesCount <= 0) return 0;
  return paidTrafficInvestment / paidTrafficSalesCount;
}

export function calculateROAS(paidTrafficRevenue: number, paidTrafficInvestment: number): number {
  if (paidTrafficInvestment <= 0) return 0;
  return paidTrafficRevenue / paidTrafficInvestment;
}

export function calculateRetentionRate(customers: { salesCountInPeriod: number }[]): number {
  if (customers.length === 0) return 0;
  const returning = customers.filter((c) => c.salesCountInPeriod > 1).length;
  return returning / customers.length;
}

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npx vitest run tests/lib/finance.test.ts`
Expected: PASS

- [ ] **Step 5: Write failing tests for `lib/customer-alerts.ts`**

```ts
import { describe, it, expect } from "vitest";
import { isInUpgradeWindow, isBirthdayWithinDays, daysInStock } from "@/lib/customer-alerts";

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
```

- [ ] **Step 6: Run tests, verify they fail**

Run: `npx vitest run tests/lib/customer-alerts.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 7: Implement `lib/customer-alerts.ts`**

```ts
function startOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function isInUpgradeWindow(lastSaleDate: string | null, upgradeAlertMonths: number, now: Date = new Date()): boolean {
  if (!lastSaleDate) return false;
  const last = new Date(lastSaleDate);
  const threshold = new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth() + upgradeAlertMonths, last.getUTCDate()));
  return startOfDayUTC(now) >= threshold;
}

export function isBirthdayWithinDays(birthdate: string | null, days: number, now: Date = new Date()): boolean {
  if (!birthdate) return false;
  const birth = new Date(birthdate);
  const today = startOfDayUTC(now);
  let nextBirthday = new Date(Date.UTC(today.getUTCFullYear(), birth.getUTCMonth(), birth.getUTCDate()));
  if (nextBirthday < today) {
    nextBirthday = new Date(Date.UTC(today.getUTCFullYear() + 1, birth.getUTCMonth(), birth.getUTCDate()));
  }
  const diffDays = Math.round((nextBirthday.getTime() - today.getTime()) / 86400000);
  return diffDays >= 0 && diffDays <= days;
}

export function daysInStock(purchaseDate: string, now: Date = new Date()): number {
  const purchase = startOfDayUTC(new Date(purchaseDate));
  const today = startOfDayUTC(now);
  return Math.max(0, Math.round((today.getTime() - purchase.getTime()) / 86400000));
}
```

- [ ] **Step 8: Run tests, verify they pass**

Run: `npx vitest run tests/lib/customer-alerts.test.ts`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add lib/finance.ts lib/customer-alerts.ts tests/lib/finance.test.ts tests/lib/customer-alerts.test.ts
git commit -m "feat: add finance and customer-alert calculation library with tests"
```

---

### Task 4: Validation schemas

**Files:**
- Create: `lib/validation/customer.ts`
- Create: `lib/validation/sale.ts`
- Create: `lib/validation/cost-entry.ts`
- Create: `lib/validation/monthly-input.ts`
- Create: `lib/validation/seller.ts`
- Create: `lib/validation/store-settings.ts`
- Create: `lib/validation/price-reference.ts`
- Test: `tests/lib/validation/sale.test.ts`
- Test: `tests/lib/validation/customer.test.ts`

**Interfaces:**
- Produces: `customerSchema`/`type CustomerInput`, `saleSchema`/`type SaleInput`, `costEntrySchema`/`type CostEntryInput`, `monthlyInputSchema`/`type MonthlyInputInput`, `sellerSchema`/`type SellerInput`, `storeSettingsSchema`/`type StoreSettingsInput`, `priceReferenceSchema`/`type PriceReferenceInput`. Consumed by Tasks 5–10's form dialogs.

- [ ] **Step 1: Write failing tests for the sale schema's cross-field rule**

```ts
import { describe, it, expect } from "vitest";
import { saleSchema } from "@/lib/validation/sale";

const base = {
  customer_id: "11111111-1111-1111-1111-111111111111",
  seller_id: "22222222-2222-2222-2222-222222222222",
  product_id: null,
  sale_channel: "pdv" as const,
  sale_price: "100",
  payment_method: "pix",
  installments: "1",
  accessories: [] as { accessory_id: string; quantity: string; unit_price: string }[],
};

describe("saleSchema", () => {
  it("rejects a sale with no product and no accessories", () => {
    const result = saleSchema.safeParse(base);
    expect(result.success).toBe(false);
  });
  it("accepts a sale with a product and no accessories", () => {
    const result = saleSchema.safeParse({ ...base, product_id: "33333333-3333-3333-3333-333333333333" });
    expect(result.success).toBe(true);
  });
  it("accepts a sale with no product but at least one accessory", () => {
    const result = saleSchema.safeParse({
      ...base,
      accessories: [{ accessory_id: "44444444-4444-4444-4444-444444444444", quantity: "1", unit_price: "50" }],
    });
    expect(result.success).toBe(true);
  });
  it("rejects a non-positive sale price", () => {
    const result = saleSchema.safeParse({ ...base, product_id: "33333333-3333-3333-3333-333333333333", sale_price: "0" });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Write failing tests for the customer schema**

```ts
import { describe, it, expect } from "vitest";
import { customerSchema } from "@/lib/validation/customer";

describe("customerSchema", () => {
  it("requires a name and whatsapp", () => {
    expect(customerSchema.safeParse({ name: "", whatsapp: "", birthdate: "", acquisition_channel: "" }).success).toBe(false);
  });
  it("accepts a minimal valid customer", () => {
    expect(
      customerSchema.safeParse({ name: "Maria Silva", whatsapp: "11999998888", birthdate: "", acquisition_channel: "instagram" }).success
    ).toBe(true);
  });
  it("rejects a birthdate in the future", () => {
    const future = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
    expect(
      customerSchema.safeParse({ name: "Maria Silva", whatsapp: "11999998888", birthdate: future, acquisition_channel: "instagram" }).success
    ).toBe(false);
  });
});
```

- [ ] **Step 3: Run both test files, verify they fail**

Run: `npx vitest run tests/lib/validation/sale.test.ts tests/lib/validation/customer.test.ts`
Expected: FAIL — modules don't exist.

- [ ] **Step 4: Implement `lib/validation/sale.ts`**

```ts
import { z } from "zod";

export const SALE_CHANNELS = ["instagram", "whatsapp", "pdv", "referral", "paid_traffic"] as const;

export const saleSchema = z
  .object({
    customer_id: z.string().uuid({ message: "Selecione um cliente" }),
    seller_id: z.string().uuid({ message: "Selecione um vendedor" }),
    product_id: z.string().uuid().nullable(),
    sale_channel: z.enum(SALE_CHANNELS, { errorMap: () => ({ message: "Selecione um canal de origem" }) }),
    sale_price: z.coerce.number({ invalid_type_error: "Informe o valor da venda" }).positive("O valor da venda deve ser maior que zero"),
    payment_method: z.string().trim().min(1, "Informe a forma de pagamento"),
    installments: z.coerce.number().int().min(1).default(1),
    accessories: z
      .array(
        z.object({
          accessory_id: z.string().uuid(),
          quantity: z.coerce.number().int().positive("Quantidade deve ser maior que zero"),
          unit_price: z.coerce.number().nonnegative(),
        })
      )
      .default([]),
  })
  .superRefine((data, ctx) => {
    if (!data.product_id && data.accessories.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A venda precisa ter um aparelho ou pelo menos um acessório",
        path: ["product_id"],
      });
    }
  });

export type SaleInput = z.infer<typeof saleSchema>;
```

- [ ] **Step 5: Implement `lib/validation/customer.ts`**

```ts
import { z } from "zod";

export const ACQUISITION_CHANNELS = ["instagram", "whatsapp", "pdv", "referral", "paid_traffic"] as const;

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do cliente"),
  whatsapp: z
    .string()
    .trim()
    .min(10, "Informe um WhatsApp válido com DDD")
    .regex(/^\d+$/, "Use apenas números, com DDD"),
  birthdate: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || new Date(value) <= new Date(), { message: "Data de nascimento não pode ser no futuro" }),
  acquisition_channel: z.enum(ACQUISITION_CHANNELS, { errorMap: () => ({ message: "Selecione um canal de origem" }) }),
});

export type CustomerInput = z.infer<typeof customerSchema>;
```

- [ ] **Step 6: Implement the remaining schemas**

`lib/validation/cost-entry.ts`:
```ts
import { z } from "zod";

export const COST_TYPES = ["fixed", "variable", "marketing", "supplier"] as const;

export const costEntrySchema = z.object({
  type: z.enum(COST_TYPES, { errorMap: () => ({ message: "Selecione o tipo de custo" }) }),
  description: z.string().trim().min(1, "Informe uma descrição"),
  amount: z.coerce.number().positive("O valor deve ser maior que zero"),
  date: z.string().trim().min(1, "Informe a data"),
});

export type CostEntryInput = z.infer<typeof costEntrySchema>;
```

`lib/validation/monthly-input.ts`:
```ts
import { z } from "zod";

export const monthlyInputSchema = z.object({
  month: z.string().trim().min(1, "Selecione o mês"),
  paid_traffic_investment: z.coerce.number().nonnegative().default(0),
  leads_instagram: z.coerce.number().int().nonnegative().default(0),
  leads_whatsapp: z.coerce.number().int().nonnegative().default(0),
  leads_pdv: z.coerce.number().int().nonnegative().default(0),
  leads_referral: z.coerce.number().int().nonnegative().default(0),
});

export type MonthlyInputInput = z.infer<typeof monthlyInputSchema>;
```

`lib/validation/seller.ts`:
```ts
import { z } from "zod";

export const sellerSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do vendedor"),
  email: z.string().trim().email("Informe um email válido"),
  role: z.enum(["owner", "admin", "seller"], { errorMap: () => ({ message: "Selecione um papel" }) }),
  commission_rate: z.coerce
    .number()
    .min(0, "A comissão não pode ser negativa")
    .max(1, "Use uma fração de 0 a 1 (ex.: 0.05 para 5%)"),
});

export type SellerInput = z.infer<typeof sellerSchema>;
```

`lib/validation/store-settings.ts`:
```ts
import { z } from "zod";

export const storeSettingsSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da loja"),
  logo_url: z.string().trim().url("Informe uma URL válida").or(z.literal("")).optional(),
  monthly_revenue_goal: z.coerce.number().nonnegative(),
  stock_alert_days: z.coerce.number().int().positive("Deve ser maior que zero"),
  upgrade_alert_months: z.coerce.number().int().positive("Deve ser maior que zero"),
});

export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>;
```

`lib/validation/price-reference.ts`:
```ts
import { z } from "zod";

export const priceReferenceSchema = z.object({
  model: z.string().trim().min(1, "Informe o modelo"),
  storage: z.string().trim().min(1, "Informe o armazenamento"),
  base_price: z.coerce.number().positive("O preço base deve ser maior que zero"),
  grade_multiplier_a_plus: z.coerce.number().min(0).max(1),
  grade_multiplier_a: z.coerce.number().min(0).max(1),
  grade_multiplier_b: z.coerce.number().min(0).max(1),
  grade_multiplier_c: z.coerce.number().min(0).max(1),
});

export type PriceReferenceInput = z.infer<typeof priceReferenceSchema>;
```

- [ ] **Step 7: Run tests, verify they pass**

Run: `npx vitest run tests/lib/validation/sale.test.ts tests/lib/validation/customer.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add lib/validation/customer.ts lib/validation/sale.ts lib/validation/cost-entry.ts lib/validation/monthly-input.ts lib/validation/seller.ts lib/validation/store-settings.ts lib/validation/price-reference.ts tests/lib/validation
git commit -m "feat: add zod validation schemas for sales, customers, finance and settings"
```

---

### Task 5: Clientes module

**Files:**
- Create: `components/clientes/customer-list.tsx`
- Create: `components/clientes/customer-form-dialog.tsx`
- Create: `components/clientes/customer-timeline.tsx`
- Create: `app/(dashboard)/clientes/page.tsx`
- Create: `app/(dashboard)/clientes/[customerId]/page.tsx`

**Interfaces:**
- Consumes: `getActiveStoreId`, `customerSchema`/`CustomerInput` (Task 4), `isInUpgradeWindow`/`isBirthdayWithinDays`/`formatCurrencyBRL` (Task 3), `toast` (Task 1), `Badge`/`Button`/`Card`/`Dialog`/`Input`/`Select`/`ConfirmDialog` from existing `components/ui`/`components/confirm-dialog.tsx`.
- Produces: route `/clientes` (list) and `/clientes/[customerId]` (profile) — matches `lib/navigation.ts`'s existing `/clientes` entry.

- [ ] **Step 1: Build the customer form dialog**

`components/clientes/customer-form-dialog.tsx` — follow `components/estoque/product-form-dialog.tsx` exactly: `"use client"`, `useForm<CustomerInput>({ resolver: zodResolver(customerSchema) })`, `reset()` on `open`/`customer` change, on submit calls `supabase.from("customers").insert(...)` or `.update(...).eq("id", customer.id)` scoped with `store_id: storeId`, on success calls `toast.success("Cliente salvo com sucesso")` and `onSaved()`, on failure `setError("root", { message: "Não foi possível salvar o cliente." })` and `toast.error(...)`. `acquisition_channel` uses the `Select` primitive with options `instagram|whatsapp|pdv|referral|paid_traffic` labeled in Portuguese (Instagram, WhatsApp, Loja física, Indicação, Tráfego pago).

- [ ] **Step 2: Build the customer list with search and filters**

`components/clientes/customer-list.tsx` — follow `components/estoque/product-list.tsx`'s exact pattern: `useState<Customer[] | null>(null)`, load on mount via `getActiveStoreId`, debounce (300ms) a text search on `name`/`whatsapp` (`.or(\`name.ilike.%${term}%,whatsapp.ilike.%${term}%\`)`), a `Select` filter for `acquisition_channel`, and a client-side-computed `Select` filter for "status de upgrade" (`todos | em janela | fora da janela`) applied after fetch using `isInUpgradeWindow(lastSaleDateByCustomerId[c.id], store.upgrade_alert_months)` — this requires also fetching each customer's most recent `sales.sold_at` (one query: `sales.select("customer_id, sold_at").eq("store_id", storeId).order("sold_at", { ascending: false })`, then reduce to a `Map<customer_id, latest sold_at>` client-side) and the store's `upgrade_alert_months` (`stores.select("upgrade_alert_months").eq("id", storeId).single()`). Request-generation guard identical to `product-list.tsx`. Each row shows a `Badge` for `acquisition_channel` and, when in the upgrade window, a `Badge variant="warning"` reading "Janela de upgrade". Row click navigates to `/clientes/[id]`. Delete uses `ConfirmDialog` with the same row-count-after-delete check as Estoque.

- [ ] **Step 3: Build the purchase timeline**

`components/clientes/customer-timeline.tsx` — receives `sales: { id: string; sold_at: string; sale_price: number; sale_channel: string }[]`. Empty state (`sales.length === 0`): dashed box "Nenhuma compra registrada ainda." Otherwise renders a vertical list ordered newest-first, each entry showing formatted date, `formatCurrencyBRL(sale_price)`, and a channel `Badge`.

- [ ] **Step 4: Build the list page**

`app/(dashboard)/clientes/page.tsx`:
```tsx
import { CustomerList } from "@/components/clientes/customer-list";

export default function ClientesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Clientes</h1>
      <CustomerList />
    </div>
  );
}
```

- [ ] **Step 5: Build the profile page**

`app/(dashboard)/clientes/[customerId]/page.tsx` — client component. On mount: resolve `storeId`, fetch the customer row (`404`/redirect back to `/clientes` if not found or not in this store), fetch all `sales` for that `customer_id` ordered by `sold_at desc`, fetch `stores.upgrade_alert_months`. Render: customer name + `acquisition_channel` badge, LTV card (`formatCurrencyBRL(customer.ltv)`), upgrade-window alert banner (`bg-warning/10 border-warning text-warning`) when `isInUpgradeWindow(sales[0]?.sold_at ?? null, upgradeAlertMonths)`, birthday alert banner (`bg-primary/10 border-primary text-primary`) when `isBirthdayWithinDays(customer.birthdate, 7)`, then `<CustomerTimeline sales={sales} />`.

- [ ] **Step 6: Verify build and manual smoke test**

Run: `npm run build`
Then: `npm run dev`, sign in, visit `/clientes`, create a customer, search/filter, open its profile, confirm empty-state timeline renders, confirm no console errors.

- [ ] **Step 7: Commit**

```bash
git add components/clientes "app/(dashboard)/clientes"
git commit -m "feat: add Clientes module with list, filters, profile and timeline"
```

---

### Task 6: Nova Venda — 5-step wizard

**Files:**
- Create: `lib/sale-wizard-store.ts` (zustand)
- Create: `components/vendas/step-customer.tsx`
- Create: `components/vendas/step-product.tsx`
- Create: `components/vendas/step-accessories.tsx`
- Create: `components/vendas/step-details.tsx`
- Create: `components/vendas/step-summary.tsx`
- Create: `components/vendas/sale-wizard.tsx`
- Create: `app/(dashboard)/vendas/nova/page.tsx`

**Interfaces:**
- Consumes: `getActiveStoreId`, `saleSchema` (Task 4), `formatCurrencyBRL` (Task 3), `toast` (Task 1), `customer-form-dialog` from Task 5 (reused for "create customer" inline in step 1).
- Produces: zustand store shape consumed across steps: `{ customer: Customer | null; product: Product | null; accessories: {accessory: Accessory; quantity: number}[]; saleChannel: string; sellerId: string; paymentMethod: string; installments: number; salePrice: number; setCustomer; setProduct; addAccessory; removeAccessory; setDetails; setSalePrice; reset }`.

- [ ] **Step 1: Build the wizard state store**

`lib/sale-wizard-store.ts`:
```ts
import { create } from "zustand";

export type WizardAccessory = { accessoryId: string; name: string; quantity: number; unitPrice: number; availableQuantity: number };
export type WizardProduct = { id: string; model: string; storage: string; imei: string | null; acquisitionCost: number; repairCost: number; finalPrice: number | null } | null;
export type WizardCustomer = { id: string; name: string } | null;

type SaleWizardState = {
  customer: WizardCustomer;
  product: WizardProduct;
  accessories: WizardAccessory[];
  saleChannel: string;
  sellerId: string;
  paymentMethod: string;
  installments: number;
  salePrice: number;
  setCustomer: (customer: WizardCustomer) => void;
  setProduct: (product: WizardProduct) => void;
  addAccessory: (accessory: WizardAccessory) => void;
  updateAccessoryQuantity: (accessoryId: string, quantity: number) => void;
  removeAccessory: (accessoryId: string) => void;
  setDetails: (details: { saleChannel: string; sellerId: string; paymentMethod: string; installments: number }) => void;
  setSalePrice: (salePrice: number) => void;
  reset: () => void;
};

const initialState = {
  customer: null as WizardCustomer,
  product: null as WizardProduct,
  accessories: [] as WizardAccessory[],
  saleChannel: "",
  sellerId: "",
  paymentMethod: "",
  installments: 1,
  salePrice: 0,
};

export const useSaleWizardStore = create<SaleWizardState>((set) => ({
  ...initialState,
  setCustomer: (customer) => set({ customer }),
  setProduct: (product) => set({ product, salePrice: product?.finalPrice ?? 0 }),
  addAccessory: (accessory) =>
    set((state) => ({
      accessories: state.accessories.some((a) => a.accessoryId === accessory.accessoryId)
        ? state.accessories
        : [...state.accessories, accessory],
    })),
  updateAccessoryQuantity: (accessoryId, quantity) =>
    set((state) => ({
      accessories: state.accessories.map((a) => (a.accessoryId === accessoryId ? { ...a, quantity } : a)),
    })),
  removeAccessory: (accessoryId) =>
    set((state) => ({ accessories: state.accessories.filter((a) => a.accessoryId !== accessoryId) })),
  setDetails: (details) => set(details),
  setSalePrice: (salePrice) => set({ salePrice }),
  reset: () => set(initialState),
}));
```

- [ ] **Step 2: Build Step 1 — customer search or create**

`components/vendas/step-customer.tsx` — text input debounced 300ms searching `customers` by `name`/`whatsapp` (`.ilike`) scoped to `storeId`, results list to click-select (calls `setCustomer`), and a "Novo cliente" button opening `CustomerFormDialog` from Task 5 (on save, calls `setCustomer` with the returned row and auto-advances). Shows the currently selected customer as a `Card` with a "Trocar" button to clear selection. Disallows advancing to step 2 while `customer === null`.

- [ ] **Step 3: Build Step 2 — product by IMEI or model**

`components/vendas/step-product.tsx` — a toggle (`Select` or two buttons) between "Buscar por IMEI" (exact `.eq("imei", term)`) and "Buscar por modelo" (`.ilike("model", "%term%")`), both filtered to `status = "available"` and `store_id = storeId`. Results show model/storage/color/grade/`final_price` (fallback to `suggested_price`, fallback to a manual `Input` if both are null, since Checkup isn't built yet and a product may have no price set). Selecting calls `setProduct`. Includes a "Pular — venda só de acessórios" button that calls `setProduct(null)` and advances (accessory-only sale, allowed by the schema/RPC).

- [ ] **Step 4: Build Step 3 — accessories from stock**

`components/vendas/step-accessories.tsx` — lists `accessories` where `quantity > 0` for `storeId`, each row has a quantity `Input` (clamped client-side to `min(1, accessory.quantity)`, real enforcement happens server-side in the RPC) and an "Adicionar" button calling `addAccessory`. Selected accessories render below with a remove button and a running subtotal. This step can be skipped entirely (0 accessories is valid).

- [ ] **Step 5: Build Step 4 — sale details**

`components/vendas/step-details.tsx` — RHF form (no zod resolver needed here since the whole wizard is validated at submit time in Step 5's summary, but reuse `saleSchema`'s enums for the `Select` options) for `sale_channel` (5 options), `seller_id` (`Select` populated from `store_users` for this store, label `name`), `payment_method` (free text `Input`), `installments` (`Input type="number"`), and an editable `sale_price` `Input` pre-filled from `product.finalPrice` (or 0 if accessory-only) via `setSalePrice`. Calls `setDetails` + `setSalePrice` on change.

- [ ] **Step 6: Build Step 5 — summary with real-time margin**

`components/vendas/step-summary.tsx` — reads the whole wizard store, computes and displays: itemized list (product + each accessory with subtotal), total revenue (`salePrice + Σ accessory.quantity*unitPrice`), CMV (`product.acquisitionCost + product.repairCost`, 0 if no product), margem (`revenue - CMV`), comissão estimada (`salePrice × sellerCommissionRate` — fetch the selected seller's `commission_rate` when `sellerId` changes), all via `formatCurrencyBRL`. A "Confirmar venda" button that:
  1. Validates the assembled payload against `saleSchema`; on failure, shows field errors and does not submit.
  2. Calls `supabase.rpc("create_sale", { p_store_id, p_customer_id: customer.id, p_seller_id: sellerId, p_product_id: product?.id ?? null, p_sale_channel: saleChannel, p_sale_price: salePrice, p_payment_method: paymentMethod, p_installments: installments, p_acquisition_cost: product?.acquisitionCost ?? 0, p_repair_cost: product?.repairCost ?? 0, p_accessories: accessories.map(a => ({ accessory_id: a.accessoryId, quantity: a.quantity, unit_price: a.unitPrice })) })`.
  3. On success: `toast.success("Venda registrada com sucesso")`, `reset()` the wizard store, redirect to `/clientes/[customerId]` (`router.push`) so the seller immediately sees the updated LTV/timeline.
  4. On failure (e.g. RPC raised `insufficient accessory stock`): `toast.error(...)` with the raised message surfaced (Supabase JS puts the Postgres error message in `error.message`), keep the wizard state intact so the user can adjust quantities and retry — do not reset on failure.

- [ ] **Step 7: Build the wizard shell**

`components/vendas/sale-wizard.tsx` — holds `currentStep: 1|2|3|4|5` local state, a step indicator bar (5 labeled dots: Cliente, Produto, Acessórios, Detalhes, Resumo), renders the matching step component, "Voltar"/"Avançar" buttons with the per-step advance guards described above (step 1 requires `customer`, step 4 requires `sale_channel`+`seller_id`+`payment_method`+`sale_price > 0`; steps 2 and 3 have no blocking guard since both are skippable).

`app/(dashboard)/vendas/nova/page.tsx`:
```tsx
import { SaleWizard } from "@/components/vendas/sale-wizard";

export default function NovaVendaPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Nova venda</h1>
      <SaleWizard />
    </div>
  );
}
```

- [ ] **Step 8: Verify build and manual smoke test**

Run: `npm run build`
Then in dev server: walk the wizard end-to-end for (a) a product-only sale, (b) an accessory-only sale, (c) a sale with both, (d) attempt to request more of an accessory than is in stock and confirm the inline error surfaces without leaving the app in a broken state. Confirm the sold product disappears from Estoque's available list and the accessory quantity decreased.

- [ ] **Step 9: Commit**

```bash
git add lib/sale-wizard-store.ts components/vendas "app/(dashboard)/vendas"
git commit -m "feat: add Nova Venda 5-step wizard with atomic sale submission"
```

---

### Task 7: Financeiro module

**Files:**
- Create: `lib/dre.ts`
- Test: `tests/lib/dre.test.ts`
- Create: `components/financeiro/dre-panel.tsx`
- Create: `components/financeiro/cost-entry-form.tsx`
- Create: `components/financeiro/cost-entry-list.tsx`
- Create: `components/financeiro/monthly-input-form.tsx`
- Create: `app/(dashboard)/financeiro/page.tsx`

**Interfaces:**
- Consumes: `calculateCMV`, `calculateGrossMargin`, `calculateNetMargin`, `formatCurrencyBRL` (Task 3), `costEntrySchema`, `monthlyInputSchema` (Task 4), `toast` (Task 1).
- Produces: `buildDRE(sales, costEntries, monthLabel): DRE` type used by `dre-panel.tsx` and reused by Task 8's dashboard KPI cards.

- [ ] **Step 1: Write failing test for `lib/dre.ts`**

```ts
import { describe, it, expect } from "vitest";
import { buildDRE } from "@/lib/dre";

describe("buildDRE", () => {
  it("computes every DRE line from sales and cost entries", () => {
    const dre = buildDRE(
      [
        { acquisition_cost: 1000, repair_cost: 50, gross_margin: 450, commission_amount: 45 },
        { acquisition_cost: 2000, repair_cost: 0, gross_margin: 500, commission_amount: 50 },
      ],
      [
        { type: "fixed", amount: 300 },
        { type: "variable", amount: 100 },
        { type: "marketing", amount: 200 },
        { type: "supplier", amount: 50 },
      ]
    );
    expect(dre.revenue).toBe(1500 + 3050);
    expect(dre.cmv).toBe(3050);
    expect(dre.grossMargin).toBe(950);
    expect(dre.commissions).toBe(95);
    expect(dre.costsByType).toEqual({ fixed: 300, variable: 100, marketing: 200, supplier: 50 });
    expect(dre.netMargin).toBe(950 - 300 - 100 - 200 - 50 - 95);
  });

  it("returns all zeros for an empty month, never NaN", () => {
    const dre = buildDRE([], []);
    expect(dre).toEqual({
      revenue: 0,
      cmv: 0,
      grossMargin: 0,
      grossMarginPct: 0,
      commissions: 0,
      costsByType: { fixed: 0, variable: 0, marketing: 0, supplier: 0 },
      netMargin: 0,
    });
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run tests/lib/dre.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement `lib/dre.ts`**

```ts
import { calculateCMV, calculateGrossMargin } from "./finance";

export type DRE = {
  revenue: number;
  cmv: number;
  grossMargin: number;
  grossMarginPct: number;
  commissions: number;
  costsByType: { fixed: number; variable: number; marketing: number; supplier: number };
  netMargin: number;
};

type SaleForDRE = { acquisition_cost: number; repair_cost: number; gross_margin: number; commission_amount: number | null };
type CostEntryForDRE = { type: "fixed" | "variable" | "marketing" | "supplier"; amount: number };

export function buildDRE(sales: SaleForDRE[], costEntries: CostEntryForDRE[]): DRE {
  const cmv = calculateCMV(sales);
  const grossMargin = calculateGrossMargin(sales);
  const revenue = cmv + grossMargin;
  const commissions = sales.reduce((sum, s) => sum + Number(s.commission_amount ?? 0), 0);
  const costsByType = { fixed: 0, variable: 0, marketing: 0, supplier: 0 };
  for (const entry of costEntries) {
    costsByType[entry.type] += Number(entry.amount);
  }
  const totalCosts = costsByType.fixed + costsByType.variable + costsByType.marketing + costsByType.supplier;
  const netMargin = grossMargin - totalCosts - commissions;
  const grossMarginPct = revenue > 0 ? grossMargin / revenue : 0;
  return { revenue, cmv, grossMargin, grossMarginPct, commissions, costsByType, netMargin };
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx vitest run tests/lib/dre.test.ts`
Expected: PASS

- [ ] **Step 5: Build the cost entry form and list**

`components/financeiro/cost-entry-form.tsx` — RHF + `costEntrySchema`, on submit computes `month` as the first day of the entered `date`'s month (`date.slice(0, 7) + "-01"`) and inserts into `cost_entries` with `store_id`; `toast.success`/`toast.error` + inline root error on RLS rejection (owner/admin only — a `seller` submitting gets an RLS error, shown inline, same as Estoque's pattern).

`components/financeiro/cost-entry-list.tsx` — follows the Estoque list pattern (skeleton/empty-state), filtered to the selected month, columns: tipo (`Badge`), descrição, valor, data; delete uses `ConfirmDialog` with the row-count check.

- [ ] **Step 6: Build the monthly inputs form**

`components/financeiro/monthly-input-form.tsx` — RHF + `monthlyInputSchema`, on submit does `supabase.from("monthly_inputs").upsert({ store_id, month, ...values }, { onConflict: "store_id,month" })` (relies on the existing `unique (store_id, month)` constraint), loads the existing row for the selected month on mount to prefill (empty defaults if none exists yet — first time entering this month's numbers).

- [ ] **Step 7: Build the DRE panel and page**

`components/financeiro/dre-panel.tsx` — a month picker (`<input type="month">`), on change fetches `sales` where `sold_at` falls in that month and `cost_entries` where `month = selected`, calls `buildDRE`, renders each line (`Receita`, `CMV`, `Margem bruta` + `%`, `Custos fixos`, `Custos variáveis`, `Marketing`, `Fornecedor`, `Comissões`, `Margem líquida`) as a simple table/card grid using `formatCurrencyBRL`.

`app/(dashboard)/financeiro/page.tsx` — tab shell identical in structure to `app/(dashboard)/estoque/page.tsx` (reuse the same tab-button pattern), tabs: "DRE" (→ `DrePanel`), "Lançamentos" (→ `CostEntryForm` + `CostEntryList`), "Tráfego e leads" (→ `MonthlyInputForm`).

- [ ] **Step 8: Verify build and manual smoke test**

Run: `npm run build`
Then: add a cost entry, add monthly inputs, confirm the DRE panel reflects a sale made in Task 6's smoke test for the current month.

- [ ] **Step 9: Commit**

```bash
git add lib/dre.ts tests/lib/dre.test.ts components/financeiro "app/(dashboard)/financeiro"
git commit -m "feat: add Financeiro module with DRE, lancamentos and monthly inputs"
```

---

### Task 8: Dashboard module

**Files:**
- Create: `components/dashboard/kpi-cards.tsx`
- Create: `components/dashboard/revenue-line-chart.tsx`
- Create: `components/dashboard/channel-bar-chart.tsx`
- Create: `components/dashboard/metric-cards.tsx`
- Create: `components/dashboard/goal-progress.tsx`
- Create: `components/dashboard/alerts-panel.tsx`
- Modify: `app/(dashboard)/dashboard/page.tsx` (replace placeholder)

**Interfaces:**
- Consumes: `buildDRE` (Task 7), `calculateCAC`, `calculateROAS`, `calculateRetentionRate`, `formatCurrencyBRL` (Task 3), `isInUpgradeWindow`, `isBirthdayWithinDays` (Task 3).

- [ ] **Step 1: Build KPI cards**

`components/dashboard/kpi-cards.tsx` — receives a `DRE` (current month, via `buildDRE`) as a prop, renders 4 `Card`s: Faturamento, CMV, Margem bruta (`grossMarginPct` as `%`), Margem líquida.

- [ ] **Step 2: Build the 6-month revenue line chart**

`components/dashboard/revenue-line-chart.tsx` — receives `data: { month: string; revenue: number }[]` (6 entries, oldest first), renders a Recharts `LineChart` (`ResponsiveContainer`, `Line dataKey="revenue"`, `XAxis dataKey="month"`) styled with the dark theme tokens (`stroke: "hsl(var(--primary))"`, grid `stroke: "hsl(var(--border))"`).

- [ ] **Step 3: Build the sales-by-channel bar chart**

`components/dashboard/channel-bar-chart.tsx` — receives `data: { channel: string; total: number }[]`, renders a Recharts `BarChart` with one bar per `SALE_CHANNELS` entry (0 for channels with no sales that month, not omitted — keeps the chart's axis stable).

- [ ] **Step 4: Build the secondary metric cards**

`components/dashboard/metric-cards.tsx` — receives `avgLtv: number`, `cacByChannel: { channel: string; cac: number }[]`, `retentionRate: number`; renders LTV médio card, a small CAC-by-channel list (only `paid_traffic` is non-zero per the formula; organic channels show "R$ 0,00 (orgânico)"), and retention rate as a `%`.

- [ ] **Step 5: Build the goal progress bar**

`components/dashboard/goal-progress.tsx` — receives `currentRevenue: number`, `goal: number`; renders a labeled progress bar (`bg-border` track, `bg-primary` fill, width `Math.min(100, (currentRevenue / goal) * 100)`%), handles `goal === 0` by showing "Meta não configurada" instead of dividing by zero.

- [ ] **Step 6: Build the alerts panel**

`components/dashboard/alerts-panel.tsx` — receives `upgradeWindowCount: number`, `birthdaysCount: number`, `staleStockCount: number`; renders 3 alert rows, each a link to the relevant module (`/clientes?status=upgrade`, `/clientes?birthday=7`, `/estoque`) with a count `Badge`; a row with count `0` still renders but muted (`text-muted-foreground`), not hidden — an empty alerts panel should visibly confirm "tudo em dia", not look broken/missing.

- [ ] **Step 7: Wire the dashboard page**

`app/(dashboard)/dashboard/page.tsx` — client component. On mount: resolve `storeId`, fetch `stores` row (goal, `upgrade_alert_months`, `stock_alert_days`), fetch current-month `sales` + `cost_entries` → `buildDRE`, fetch last-6-months `sales` grouped by month for the line chart, fetch current-month `sales` grouped by `sale_channel` for the bar chart, fetch all `customers` (for LTV avg, upgrade-window count via `isInUpgradeWindow` using each customer's latest sale date, birthday count via `isBirthdayWithinDays`), fetch current-month `monthly_inputs` (for CAC/ROAS), fetch `products` where `status = 'available'` (for stale-stock count via `days_in_stock > stock_alert_days`). Assemble and render all six components above plus a loading skeleton state while the initial fetch is in flight (reuse the Estoque skeleton pattern) and an inline error state if any query fails.

- [ ] **Step 8: Verify build and manual smoke test**

Run: `npm run build`
Then: visit `/dashboard`, confirm KPI cards/charts/alerts render with the data seeded in prior tasks' smoke tests, confirm a store with `monthly_revenue_goal = 0` shows "Meta não configurada" instead of crashing.

- [ ] **Step 9: Commit**

```bash
git add components/dashboard "app/(dashboard)/dashboard"
git commit -m "feat: build Dashboard with KPIs, charts, secondary metrics and alerts"
```

---

### Task 9: Rankings module

**Files:**
- Create: `lib/rankings.ts`
- Test: `tests/lib/rankings.test.ts`
- Create: `components/rankings/seller-ranking.tsx`
- Create: `components/rankings/product-ranking.tsx`
- Create: `components/rankings/channel-ranking.tsx`
- Create: `app/(dashboard)/rankings/page.tsx`

**Interfaces:**
- Produces: `rankSellers(sales, sellers): SellerRankRow[]`, `rankProducts(sales): ProductRankRow[]`, `rankChannels(sales): ChannelRankRow[]` — all pure functions over already-fetched rows, tested directly.

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { rankSellers, rankProducts, rankChannels } from "@/lib/rankings";

const sales = [
  { seller_id: "s1", sale_price: 1000, gross_margin: 300, commission_amount: 50, sale_channel: "pdv", model: "iPhone 13", storage: "128GB", accessoryCount: 2 },
  { seller_id: "s1", sale_price: 2000, gross_margin: 600, commission_amount: 100, sale_channel: "instagram", model: "iPhone 13", storage: "128GB", accessoryCount: 0 },
  { seller_id: "s2", sale_price: 1500, gross_margin: 400, commission_amount: 75, sale_channel: "pdv", model: "iPhone 12", storage: "64GB", accessoryCount: 1 },
];
const sellers = [{ id: "s1", name: "Ana" }, { id: "s2", name: "Bruno" }];

describe("rankSellers", () => {
  it("aggregates volume, average ticket, accessories per sale and commission per seller", () => {
    const result = rankSellers(sales, sellers);
    const ana = result.find((r) => r.sellerId === "s1")!;
    expect(ana.salesCount).toBe(2);
    expect(ana.totalRevenue).toBe(3000);
    expect(ana.avgTicket).toBe(1500);
    expect(ana.avgAccessoriesPerSale).toBe(1);
    expect(ana.totalCommission).toBe(150);
  });
  it("returns an empty array for no sales", () => {
    expect(rankSellers([], sellers)).toEqual([]);
  });
});

describe("rankProducts", () => {
  it("groups by model+storage and averages gross margin", () => {
    const result = rankProducts(sales);
    const iphone13 = result.find((r) => r.model === "iPhone 13" && r.storage === "128GB")!;
    expect(iphone13.unitsSold).toBe(2);
    expect(iphone13.avgGrossMargin).toBe(450);
  });
});

describe("rankChannels", () => {
  it("computes total revenue and percentage share per channel", () => {
    const result = rankChannels(sales);
    const pdv = result.find((r) => r.channel === "pdv")!;
    expect(pdv.totalRevenue).toBe(2500);
    expect(pdv.percentage).toBeCloseTo(2500 / 4500);
  });
  it("returns an empty array for no sales, never divides by zero", () => {
    expect(rankChannels([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx vitest run tests/lib/rankings.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement `lib/rankings.ts`**

```ts
type SaleForRanking = {
  seller_id: string;
  sale_price: number;
  gross_margin: number;
  commission_amount: number | null;
  sale_channel: string;
  model: string | null;
  storage: string | null;
  accessoryCount: number;
};
type SellerRow = { id: string; name: string };

export type SellerRankRow = {
  sellerId: string;
  name: string;
  salesCount: number;
  totalRevenue: number;
  avgTicket: number;
  avgAccessoriesPerSale: number;
  totalCommission: number;
};

export function rankSellers(sales: SaleForRanking[], sellers: SellerRow[]): SellerRankRow[] {
  const byId = new Map(sellers.map((s) => [s.id, s.name]));
  const groups = new Map<string, SaleForRanking[]>();
  for (const sale of sales) {
    const list = groups.get(sale.seller_id) ?? [];
    list.push(sale);
    groups.set(sale.seller_id, list);
  }
  return Array.from(groups.entries()).map(([sellerId, group]) => {
    const totalRevenue = group.reduce((sum, s) => sum + Number(s.sale_price), 0);
    const totalCommission = group.reduce((sum, s) => sum + Number(s.commission_amount ?? 0), 0);
    const totalAccessories = group.reduce((sum, s) => sum + s.accessoryCount, 0);
    return {
      sellerId,
      name: byId.get(sellerId) ?? "Vendedor removido",
      salesCount: group.length,
      totalRevenue,
      avgTicket: totalRevenue / group.length,
      avgAccessoriesPerSale: totalAccessories / group.length,
      totalCommission,
    };
  });
}

export type ProductRankRow = { model: string; storage: string; unitsSold: number; avgGrossMargin: number };

export function rankProducts(sales: SaleForRanking[]): ProductRankRow[] {
  const groups = new Map<string, SaleForRanking[]>();
  for (const sale of sales) {
    if (!sale.model || !sale.storage) continue;
    const key = `${sale.model}::${sale.storage}`;
    const list = groups.get(key) ?? [];
    list.push(sale);
    groups.set(key, list);
  }
  return Array.from(groups.entries()).map(([key, group]) => {
    const [model, storage] = key.split("::");
    const avgGrossMargin = group.reduce((sum, s) => sum + Number(s.gross_margin), 0) / group.length;
    return { model, storage, unitsSold: group.length, avgGrossMargin };
  });
}

export type ChannelRankRow = { channel: string; totalRevenue: number; percentage: number };

export function rankChannels(sales: SaleForRanking[]): ChannelRankRow[] {
  if (sales.length === 0) return [];
  const totalAll = sales.reduce((sum, s) => sum + Number(s.sale_price), 0);
  const groups = new Map<string, number>();
  for (const sale of sales) {
    groups.set(sale.sale_channel, (groups.get(sale.sale_channel) ?? 0) + Number(sale.sale_price));
  }
  return Array.from(groups.entries()).map(([channel, totalRevenue]) => ({
    channel,
    totalRevenue,
    percentage: totalAll > 0 ? totalRevenue / totalAll : 0,
  }));
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npx vitest run tests/lib/rankings.test.ts`
Expected: PASS

- [ ] **Step 5: Build the three ranking tables and the page**

`components/rankings/seller-ranking.tsx`, `components/rankings/product-ranking.tsx`, `components/rankings/channel-ranking.tsx` — each a `<table>` styled like Estoque's lists (no filters needed beyond a shared month picker), sorted descending by the primary metric (revenue for sellers/channels, units sold for products).

`app/(dashboard)/rankings/page.tsx` — a month picker shared by all three (`<input type="month">`), fetches `sales` joined with `products(model, storage)` and `sale_accessories(count)` for that month plus `store_users` for seller names, calls `rankSellers`/`rankProducts`/`rankChannels`, renders all three tables under section headings ("Vendedores", "Produtos", "Canais").

- [ ] **Step 6: Verify build and manual smoke test**

Run: `npm run build`
Then: visit `/rankings`, confirm the sale(s) created in Task 6 appear correctly attributed.

- [ ] **Step 7: Commit**

```bash
git add lib/rankings.ts tests/lib/rankings.test.ts components/rankings "app/(dashboard)/rankings"
git commit -m "feat: add Rankings module for sellers, products and channels"
```

---

### Task 10: Configurações module

**Files:**
- Create: `app/api/sellers/route.ts`
- Create: `lib/supabase/admin.ts`
- Create: `components/configuracoes/store-settings-form.tsx`
- Create: `components/configuracoes/seller-list.tsx`
- Create: `components/configuracoes/seller-form-dialog.tsx`
- Create: `components/configuracoes/price-reference-list.tsx`
- Create: `components/configuracoes/price-reference-form-dialog.tsx`
- Create: `app/(dashboard)/configuracoes/page.tsx`

**Interfaces:**
- Consumes: `storeSettingsSchema`, `sellerSchema`, `priceReferenceSchema` (Task 4), `toast` (Task 1).
- Produces: `POST /api/sellers` (server-only) accepting `{ storeId, name, email, role, commissionRate }`, returns `{ storeUserId }` or `{ error }`.

- [ ] **Step 1: Add the service-role admin client helper**

`lib/supabase/admin.ts`:
```ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
```

- [ ] **Step 2: Build the seller invite Route Handler**

`app/api/sellers/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sellerSchema } from "@/lib/validation/seller";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { storeId, ...fields } = body;
  const parsed = sellerSchema.safeParse(fields);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  if (typeof storeId !== "string") {
    return NextResponse.json({ error: "Loja inválida" }, { status: 400 });
  }

  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("store_users")
    .select("role")
    .eq("store_id", storeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Sem permissão para cadastrar vendedores" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(parsed.data.email);
  if (inviteError || !invited.user) {
    return NextResponse.json({ error: "Não foi possível convidar este email" }, { status: 400 });
  }

  const { data: storeUser, error: insertError } = await admin
    .from("store_users")
    .insert({
      store_id: storeId,
      user_id: invited.user.id,
      role: parsed.data.role,
      commission_rate: parsed.data.commission_rate,
      name: parsed.data.name,
    })
    .select("id")
    .single();

  if (insertError || !storeUser) {
    return NextResponse.json({ error: "Convite enviado, mas falhou ao vincular o vendedor à loja" }, { status: 500 });
  }

  return NextResponse.json({ storeUserId: storeUser.id });
}
```

Note: verify `lib/supabase/server.ts` exports a `createServerClient()` matching this signature — if the existing helper has a different name/signature, use the existing one (check `lib/supabase/server.ts` before writing this file) rather than introducing a second server-client factory.

- [ ] **Step 3: Build the store settings form**

`components/configuracoes/store-settings-form.tsx` — RHF + `storeSettingsSchema`, loads the current `stores` row on mount, `update()`s on submit (RLS: owner/admin only — inline error on rejection, same pattern as everywhere else), `logo_url` is a plain URL `Input` with a small `<img>` preview when non-empty (no file upload/storage bucket — out of scope; the schema's `logo_url` is a plain text URL).

- [ ] **Step 4: Build seller list + invite dialog**

`components/configuracoes/seller-form-dialog.tsx` — RHF + `sellerSchema`, on submit `POST /api/sellers` with `{ storeId, ...values }`; success shows `toast.success("Convite enviado para o vendedor")`; the dialog only supports **creating** a seller this way (email invite) — editing an existing seller's `role`/`commission_rate`/`name` is a direct `store_users` update (no new invite), so the dialog takes an `isEditing` flag and skips the invite call when editing.

`components/configuracoes/seller-list.tsx` — lists `store_users` for the store, columns name/role (`Badge`)/`commission_rate` (formatted as `%`), edit opens the same dialog in edit mode, delete uses `ConfirmDialog` removing the `store_users` row only (not the underlying auth user).

- [ ] **Step 5: Build price reference CRUD**

`components/configuracoes/price-reference-form-dialog.tsx` + `components/configuracoes/price-reference-list.tsx` — identical structure to Estoque's accessory list/form-dialog, fields per `priceReferenceSchema`, relies on the existing `unique (store_id, model, storage)` constraint (surface the resulting DB error inline as "Já existe uma referência para este modelo e armazenamento" on unique-violation, detected via `error.code === "23505"`).

- [ ] **Step 6: Wire the Configurações page**

`app/(dashboard)/configuracoes/page.tsx` — tab shell (same pattern as Estoque/Financeiro), tabs: "Loja" (→ `StoreSettingsForm`, which also includes the `stock_alert_days`/`upgrade_alert_months` fields already in that schema — no separate "Alertas" tab needed since both fields live on `stores`), "Vendedores" (→ `SellerList` + invite button), "Tabela de preços" (→ `PriceReferenceList`).

- [ ] **Step 7: Verify build and manual smoke test**

Run: `npm run build`
Then: update store settings, invite a seller (confirm the invite email arrives via Resend), add a price reference row, confirm duplicate model+storage shows the friendly inline error instead of a raw Postgres error.

- [ ] **Step 8: Commit**

```bash
git add app/api/sellers lib/supabase/admin.ts components/configuracoes "app/(dashboard)/configuracoes"
git commit -m "feat: add Configuracoes module with store settings, seller invites and price table"
```

---

### Task 11: Vercel cron routes

**Files:**
- Create: `lib/cron-auth.ts`
- Test: `tests/lib/cron-auth.test.ts`
- Create: `app/api/cron/upgrade-alerts/route.ts`
- Create: `app/api/cron/birthday-alerts/route.ts`
- Create: `app/api/cron/update-stock-days/route.ts`
- Modify: `vercel.json`

**Interfaces:**
- Produces: `verifyCronSecret(request: NextRequest): boolean` — every cron route calls this first and returns 401 if it fails.

- [ ] **Step 1: Write failing tests for the auth check**

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";

function makeRequest(header?: string) {
  return new NextRequest("https://example.com/api/cron/x", {
    headers: header ? { authorization: header } : {},
  });
}

describe("verifyCronSecret", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects when the header is missing", () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(verifyCronSecret(makeRequest())).toBe(false);
  });

  it("rejects when the header doesn't match", () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(verifyCronSecret(makeRequest("Bearer wrong"))).toBe(false);
  });

  it("rejects when CRON_SECRET is unset, even if a header is sent", () => {
    vi.stubEnv("CRON_SECRET", "");
    expect(verifyCronSecret(makeRequest("Bearer anything"))).toBe(false);
  });

  it("accepts a matching bearer header", () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(verifyCronSecret(makeRequest("Bearer s3cret"))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx vitest run tests/lib/cron-auth.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement `lib/cron-auth.ts`**

```ts
import type { NextRequest } from "next/server";

export function verifyCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx vitest run tests/lib/cron-auth.test.ts`
Expected: PASS

- [ ] **Step 5: Build the upgrade-alerts cron route**

`app/api/cron/upgrade-alerts/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { isInUpgradeWindow } from "@/lib/customer-alerts";
import { verifyCronSecret } from "@/lib/cron-auth";

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data: stores } = await admin.from("stores").select("id, name, upgrade_alert_months");
  let emailsSent = 0;

  for (const store of stores ?? []) {
    const { data: customers } = await admin
      .from("customers")
      .select("id, name, whatsapp")
      .eq("store_id", store.id);
    if (!customers || customers.length === 0) continue;

    const { data: sales } = await admin
      .from("sales")
      .select("customer_id, sold_at, sale_price, products(model)")
      .eq("store_id", store.id)
      .order("sold_at", { ascending: false });

    const latestSaleByCustomer = new Map<string, { sold_at: string; sale_price: number; model: string | null }>();
    for (const sale of sales ?? []) {
      if (!latestSaleByCustomer.has(sale.customer_id)) {
        latestSaleByCustomer.set(sale.customer_id, {
          sold_at: sale.sold_at,
          sale_price: sale.sale_price,
          model: (sale as { products?: { model: string } | null }).products?.model ?? null,
        });
      }
    }

    const inWindow = customers.filter((customer) => {
      const lastSale = latestSaleByCustomer.get(customer.id);
      return isInUpgradeWindow(lastSale?.sold_at ?? null, store.upgrade_alert_months);
    });

    if (inWindow.length === 0) continue;

    const { data: owners } = await admin
      .from("store_users")
      .select("user_id")
      .eq("store_id", store.id)
      .in("role", ["owner", "admin"]);
    const { data: authUsers } = await admin.auth.admin.listUsers();
    const ownerEmails = (owners ?? [])
      .map((o) => authUsers?.users.find((u) => u.id === o.user_id)?.email)
      .filter((email): email is string => Boolean(email));
    if (ownerEmails.length === 0) continue;

    const rows = inWindow
      .map((customer) => {
        const lastSale = latestSaleByCustomer.get(customer.id);
        return `<li>${customer.name} — ${lastSale?.model ?? "produto"} — ${new Date(lastSale!.sold_at).toLocaleDateString("pt-BR")} — ${customer.whatsapp}</li>`;
      })
      .join("");

    await resend.emails.send({
      from: "useFindash <alertas@usefindash.vercel.app>",
      to: ownerEmails,
      subject: `Clientes em janela de upgrade — ${store.name}`,
      html: `<p>Clientes em janela de upgrade:</p><ul>${rows}</ul>`,
    });
    emailsSent += 1;
  }

  return NextResponse.json({ ok: true, emailsSent });
}
```

- [ ] **Step 6: Build the birthday-alerts cron route**

`app/api/cron/birthday-alerts/route.ts` — same shape as Step 5, swapping the filter to `isBirthdayWithinDays(customer.birthdate, 7)` and the subject to `Aniversariantes dos próximos 7 dias — ${store.name}`, row text `${customer.name} — aniversário em ${new Date(...).toLocaleDateString("pt-BR")} — ${customer.whatsapp}` (compute the upcoming birthday date the same way `isBirthdayWithinDays` does internally — extract that "next birthday" calculation into an exported `nextBirthday(birthdate, now)` helper in `lib/customer-alerts.ts` so both the cron route and this helper share one implementation instead of duplicating the wrap-around logic).

- [ ] **Step 7: Add `nextBirthday` to `lib/customer-alerts.ts` and a test for it**

Modify `lib/customer-alerts.ts` to export:
```ts
export function nextBirthday(birthdate: string, now: Date = new Date()): Date {
  const birth = new Date(birthdate);
  const today = startOfDayUTC(now);
  let next = new Date(Date.UTC(today.getUTCFullYear(), birth.getUTCMonth(), birth.getUTCDate()));
  if (next < today) {
    next = new Date(Date.UTC(today.getUTCFullYear() + 1, birth.getUTCMonth(), birth.getUTCDate()));
  }
  return next;
}
```
And refactor `isBirthdayWithinDays` to call it:
```ts
export function isBirthdayWithinDays(birthdate: string | null, days: number, now: Date = new Date()): boolean {
  if (!birthdate) return false;
  const today = startOfDayUTC(now);
  const next = nextBirthday(birthdate, now);
  const diffDays = Math.round((next.getTime() - today.getTime()) / 86400000);
  return diffDays >= 0 && diffDays <= days;
}
```
Add to `tests/lib/customer-alerts.test.ts`:
```ts
describe("nextBirthday", () => {
  it("returns this year's date when it hasn't passed yet", () => {
    const now = new Date("2026-09-23T00:00:00Z");
    expect(nextBirthday("1990-09-25", now).toISOString().slice(0, 10)).toBe("2026-09-25");
  });
  it("returns next year's date when it already passed", () => {
    const now = new Date("2026-09-23T00:00:00Z");
    expect(nextBirthday("1990-01-01", now).toISOString().slice(0, 10)).toBe("2027-01-01");
  });
});
```
Run: `npx vitest run tests/lib/customer-alerts.test.ts` — expect PASS (existing `isBirthdayWithinDays` tests must still pass after the refactor).

- [ ] **Step 8: Build the update-stock-days cron route**

`app/api/cron/update-stock-days/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { daysInStock } from "@/lib/customer-alerts";
import { verifyCronSecret } from "@/lib/cron-auth";

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: products } = await admin
    .from("products")
    .select("id, purchase_date")
    .eq("status", "available")
    .not("purchase_date", "is", null);

  let updated = 0;
  for (const product of products ?? []) {
    await admin
      .from("products")
      .update({ days_in_stock: daysInStock(product.purchase_date!) })
      .eq("id", product.id);
    updated += 1;
  }

  return NextResponse.json({ ok: true, updated });
}
```

- [ ] **Step 9: Update `vercel.json`**

```json
{
  "framework": "nextjs",
  "crons": [
    { "path": "/api/cron/upgrade-alerts", "schedule": "0 8 * * 1" },
    { "path": "/api/cron/birthday-alerts", "schedule": "0 7 * * *" },
    { "path": "/api/cron/update-stock-days", "schedule": "0 6 * * *" }
  ]
}
```

- [ ] **Step 10: Verify build**

Run: `npm run build`
Then manually: `curl -i https://<preview-or-local>/api/cron/update-stock-days` with no header → expect 401; with `-H "Authorization: Bearer $CRON_SECRET"` → expect 200 and a real `updated` count.

- [ ] **Step 11: Commit**

```bash
git add lib/cron-auth.ts tests/lib/cron-auth.test.ts app/api/cron lib/customer-alerts.ts tests/lib/customer-alerts.test.ts vercel.json
git commit -m "feat: add Vercel cron routes for upgrade, birthday and stock-age alerts"
```

---

### Task 12: Full verification, push and production check

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: all tests pass, including every test file added in Tasks 3, 4, 9, 11.

- [ ] **Step 2: Run the full build**

Run: `npm run build`
Expected: succeeds with no type errors across every module added in this plan.

- [ ] **Step 3: Manual end-to-end smoke pass**

In the dev server, as a seeded owner user: create a customer, invite a seller, add a price reference, complete a full Nova Venda (product + accessory), confirm it appears in Clientes' timeline/LTV, Financeiro's DRE, Dashboard's KPIs/charts/alerts, and Rankings — the same data flowing correctly through every module is the strongest signal the wiring is correct end-to-end.

- [ ] **Step 4: Push to remote**

Run: `git push origin master`
Expected: pushes all commits from Tasks 1–11; this triggers Vercel's connected auto-deploy on `master` (per spec section 11).

- [ ] **Step 5: Verify the production deploy**

Poll `https://usefindash.vercel.app` (or check the Vercel deployment status via `vercel ls` / the Vercel dashboard if CLI access is available) until the new deployment is Ready, then visit the production URL and confirm `/dashboard`, `/clientes`, `/vendas/nova`, `/financeiro`, `/rankings`, `/configuracoes` all load without error for a real logged-in user (not just localhost).

- [ ] **Step 6: Report completion**

Summarize what shipped, any deviations from the spec made during implementation (e.g., the net-margin calculation including all four cost types instead of only fixed/variable, the logo field being a URL instead of a file upload), and anything explicitly deferred (Checkup module, IMEI lookup, billing).
