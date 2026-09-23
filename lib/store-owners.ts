import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./supabase/types";

/**
 * `listUsers()` paginates (defaults to 50 per page); a single unpaginated
 * call silently misses owners/admins once a project has more auth users
 * than that. This walks every page to build a complete id -> email map.
 */
async function listAllUserEmails(admin: SupabaseClient<Database>): Promise<Map<string, string>> {
  const emailById = new Map<string, string>();
  const perPage = 1000;
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || !data) break;
    for (const user of data.users) {
      if (user.email) emailById.set(user.id, user.email);
    }
    if (data.users.length < perPage) break;
  }
  return emailById;
}

/**
 * Resolves the email addresses of a store's owners/admins, for cron alert
 * emails. Callers should reuse one `Map` across a loop over multiple stores
 * instead of calling this per store, to avoid re-paginating auth.users
 * every iteration.
 */
export async function getStoreOwnerEmails(
  admin: SupabaseClient<Database>,
  storeId: string,
  emailById: Map<string, string>
): Promise<string[]> {
  const { data: owners } = await admin
    .from("store_users")
    .select("user_id")
    .eq("store_id", storeId)
    .in("role", ["owner", "admin"]);

  return (owners ?? [])
    .map((o) => emailById.get(o.user_id))
    .filter((email): email is string => Boolean(email));
}

export { listAllUserEmails };
