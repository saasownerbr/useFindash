// Pure access rules for a store's subscription. No server imports, so the middleware can use it too.

export type SubscriptionStatus = "trial" | "pending" | "active" | "overdue" | "cancelled" | "expired";

export interface SubscriptionSnapshot {
  status: string | null;
  trial_end: string | null;
  current_period_end: string | null;
  updated_at: string | null;
}

export type Access =
  | { access: "full"; type: "trial"; daysLeft: number; until: string }
  | { access: "full"; type: "paid"; until: string | null }
  | { access: "warning"; overdueDays: number }
  | { access: "limited"; overdueDays: number }
  | { access: "blocked" };

const DAY_MS = 24 * 60 * 60 * 1000;
/** Overdue up to this many days keeps full access with a warning; after it, access is limited. */
export const OVERDUE_WARNING_DAYS = 5;
/** A paid period whose renewal webhook never arrived still works this long past its end. */
export const PAID_GRACE_DAYS = 3;

function time(value: string | null): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function trialAccess(trialEnd: number, now: number): Access {
  return {
    access: "full",
    type: "trial",
    daysLeft: Math.max(1, Math.ceil((trialEnd - now) / DAY_MS)),
    until: new Date(trialEnd).toISOString(),
  };
}

export function evaluateAccess(sub: SubscriptionSnapshot | null, now: Date = new Date()): Access {
  if (!sub) return { access: "blocked" };
  const nowMs = now.getTime();
  const trialEnd = time(sub.trial_end);
  const periodEnd = time(sub.current_period_end);

  switch (sub.status) {
    case "trial":
      return trialEnd !== null && trialEnd > nowMs ? trialAccess(trialEnd, nowMs) : { access: "blocked" };

    // Checkout started but not paid yet: whatever access the store had before still runs out on schedule.
    case "pending":
      if (trialEnd !== null && trialEnd > nowMs) return trialAccess(trialEnd, nowMs);
      if (periodEnd !== null && periodEnd > nowMs) return { access: "full", type: "paid", until: sub.current_period_end };
      return { access: "blocked" };

    case "active":
      if (periodEnd !== null && periodEnd + PAID_GRACE_DAYS * DAY_MS <= nowMs) return { access: "blocked" };
      return { access: "full", type: "paid", until: sub.current_period_end };

    case "overdue": {
      const since = time(sub.updated_at) ?? periodEnd ?? nowMs;
      const overdueDays = Math.max(0, Math.floor((nowMs - since) / DAY_MS));
      return overdueDays < OVERDUE_WARNING_DAYS ? { access: "warning", overdueDays } : { access: "limited", overdueDays };
    }

    default:
      return { access: "blocked" };
  }
}

/** Until when a "full" result can be trusted without asking the database again. */
export function fullAccessUntil(result: Access): number | null {
  if (result.access !== "full") return null;
  return result.until ? new Date(result.until).getTime() : null;
}

// Paths a store with blocked access can still open: the plans page, its APIs, and the auth screens.
const ALWAYS_OPEN_PATHS = ["/planos", "/api/", "/onboarding", "/login", "/signup", "/recuperar-senha", "/redefinir-senha", "/auth/"];

export function requiresAccessCheck(pathname: string): boolean {
  return !ALWAYS_OPEN_PATHS.some((path) => pathname.startsWith(path));
}
