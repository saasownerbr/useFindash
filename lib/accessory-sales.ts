import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./supabase/types";

/**
 * Sums the revenue and cost of accessories sold by a store in [start, end).
 * `sales.sale_price`/`gross_margin` only cover the device leg of a sale, so
 * accessory-only (or mixed) sales need this on top for an accurate DRE.
 * Cost uses the accessory's current `cost` (not frozen at sale time, unlike
 * `sales.acquisition_cost`) since `sale_accessories` doesn't store it.
 * Filters through the sales join, so it runs alongside the sales query
 * instead of waiting for its ids.
 */
export async function sumAccessorySales(
  supabase: SupabaseClient<Database>,
  storeId: string,
  start: string,
  end: string
): Promise<{ revenue: number; cost: number }> {
  const { data } = await supabase
    .from("sale_accessories")
    .select("quantity, unit_price, accessories(cost), sales!inner(store_id, sold_at)")
    .eq("sales.store_id", storeId)
    .gte("sales.sold_at", start)
    .lt("sales.sold_at", end);

  let revenue = 0;
  let cost = 0;
  for (const row of data ?? []) {
    revenue += row.quantity * Number(row.unit_price);
    cost += row.quantity * Number((row.accessories as { cost: number } | null)?.cost ?? 0);
  }
  return { revenue, cost };
}
