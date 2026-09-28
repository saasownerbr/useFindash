import type { SupabaseClient } from "@supabase/supabase-js";

import { NO_SERVICE_REVENUE, REVENUE_STATUSES, sumServiceRevenue, type ServiceRevenue } from "./services";
import type { Database } from "./supabase/types";

/**
 * Only services charged through the sale wizard are revenue; one registered on its own in /assistencia is a bench
 * record and never reaches the totals, so money is never counted twice.
 */
const BILLED_SOURCE = "sale";

/**
 * Revenue, parts cost (its CMV) and count of the services sold and finished in [start, end], dated by completed_at.
 * Any error reads as no services, so the dashboard and the DRE keep working if the table is unavailable.
 */
export async function fetchServiceRevenue(
  supabase: SupabaseClient<Database>,
  storeId: string,
  start: string,
  end: string
): Promise<ServiceRevenue> {
  const { data, error } = await supabase
    .from("sale_services")
    .select("status, total_cost, parts_cost")
    .eq("store_id", storeId)
    .eq("source", BILLED_SOURCE)
    .in("status", REVENUE_STATUSES)
    .gte("completed_at", start)
    .lte("completed_at", end);
  if (error) return { ...NO_SERVICE_REVENUE };
  return sumServiceRevenue(data ?? []);
}

/** Sold and finished services since `since`, for charts that bucket by month (completed_at, total_cost). */
export async function fetchFinishedServices(
  supabase: SupabaseClient<Database>,
  storeId: string,
  since: string
): Promise<{ completed_at: string; total_cost: number }[]> {
  const { data, error } = await supabase
    .from("sale_services")
    .select("completed_at, total_cost")
    .eq("store_id", storeId)
    .eq("source", BILLED_SOURCE)
    .in("status", REVENUE_STATUSES)
    .gte("completed_at", since);
  if (error) return [];
  return (data ?? [])
    .filter((row): row is { completed_at: string; total_cost: number } => !!row.completed_at)
    .map((row) => ({ completed_at: row.completed_at, total_cost: Number(row.total_cost ?? 0) }));
}
