import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./supabase/types";

/**
 * Sums the revenue and cost of accessories sold within a set of sales.
 * `sales.sale_price`/`gross_margin` only cover the device leg of a sale, so
 * accessory-only (or mixed) sales need this on top for an accurate DRE.
 * Cost uses the accessory's current `cost` (not frozen at sale time, unlike
 * `sales.acquisition_cost`) since `sale_accessories` doesn't store it.
 */
export async function sumAccessorySales(
  supabase: SupabaseClient<Database>,
  saleIds: string[]
): Promise<{ revenue: number; cost: number }> {
  if (saleIds.length === 0) return { revenue: 0, cost: 0 };

  const { data } = await supabase
    .from("sale_accessories")
    .select("quantity, unit_price, accessories(cost)")
    .in("sale_id", saleIds);

  let revenue = 0;
  let cost = 0;
  for (const row of data ?? []) {
    revenue += row.quantity * Number(row.unit_price);
    cost += row.quantity * Number((row.accessories as { cost: number } | null)?.cost ?? 0);
  }
  return { revenue, cost };
}
