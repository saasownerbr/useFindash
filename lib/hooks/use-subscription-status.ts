import { useEffect, useState } from "react";

import type { Access } from "@/lib/subscription-access";

export interface SubscriptionStatus {
  status: string | null;
  plan: { name: string; interval: string | null } | null;
  trial_end: string | null;
  current_period_end: string | null;
  access: Access;
}

/** The store's subscription from /api/subscription/status; null while loading or on failure. */
export function useSubscriptionStatus(): SubscriptionStatus | null {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/subscription/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setStatus(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}

/** Opens the Asaas invoice to pay; falls back to /planos when there is none. */
export async function openCurrentInvoice(): Promise<void> {
  try {
    const res = await fetch("/api/subscription/invoice");
    const data = res.ok ? await res.json() : null;
    window.location.href = data?.invoiceUrl ?? "/planos";
  } catch {
    window.location.href = "/planos";
  }
}
