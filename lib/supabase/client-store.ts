import { createClient } from "@/lib/supabase/client";
import { getActiveStoreId } from "@/lib/supabase/store";

let cached: { userId: string; storeId: Promise<string | null> } | null = null;

/**
 * The signed-in user's store, resolved once per browser session and reused by
 * every page. getSession() reads the session from cookies without a network
 * call (middleware already verified it); RLS still guards every query.
 */
export async function getClientStoreId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user.id;
  if (!userId) return null;

  if (cached?.userId !== userId) {
    const storeId = getActiveStoreId(supabase, userId);
    cached = { userId, storeId };
    // Don't remember "no store": onboarding or a transient error must be retried.
    storeId.then((id) => {
      if (id === null && cached?.storeId === storeId) cached = null;
    });
  }
  return cached.storeId;
}
