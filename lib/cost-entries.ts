import type { SupabaseClient } from "@supabase/supabase-js";

import type { CostEntryForPeriod } from "./dre";
import { firstOfMonth, lastOfMonth } from "./period";
import type { Database } from "./supabase/types";

/**
 * Cost entries for every month [start, end] touches, the input periodCosts needs (fixed costs are prorated by
 * month, wherever in the month they were entered). Shared by the dashboard and the DRE so both read the same rows.
 */
export async function fetchCostEntries(
  supabase: SupabaseClient<Database>,
  storeId: string,
  start: Date,
  end: Date
): Promise<{ entries: CostEntryForPeriod[]; error: boolean }> {
  const { data, error } = await supabase
    .from("cost_entries")
    .select("type, amount, date")
    .eq("store_id", storeId)
    .gte("date", firstOfMonth(start))
    .lte("date", lastOfMonth(end));
  return { entries: (data ?? []) as CostEntryForPeriod[], error: !!error };
}
