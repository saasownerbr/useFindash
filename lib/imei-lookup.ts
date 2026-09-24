import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";
import { isValidImei } from "@/lib/used-device-calculator";

export type ImeiLookup =
  | { kind: "invalid" }
  | { kind: "exact"; model: string; storage: string; status: string }
  | { kind: "tac"; model: string }
  | { kind: "unknown" };

/**
 * Identifies a device from its IMEI using the store's own history. ANATEL has
 * no public IMEI-to-model API, so: the exact IMEI (already bought/sold here),
 * else the first 8 digits (TAC), which identify the model.
 */
export async function lookupImei(
  supabase: SupabaseClient<Database>,
  storeId: string,
  imei: string
): Promise<ImeiLookup> {
  if (!isValidImei(imei)) return { kind: "invalid" };

  const [exact, sameTac] = await Promise.all([
    supabase
      .from("products")
      .select("model, storage, status")
      .eq("store_id", storeId)
      .eq("imei", imei)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("products")
      .select("model")
      .eq("store_id", storeId)
      .like("imei", `${imei.slice(0, 8)}%`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (exact.data) return { kind: "exact", ...exact.data };
  if (sameTac.data) return { kind: "tac", model: sameTac.data.model };
  return { kind: "unknown" };
}
