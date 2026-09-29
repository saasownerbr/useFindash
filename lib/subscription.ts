import type { SupabaseClient } from "@supabase/supabase-js";

import { asaasFetch, brazilDate, currentSubscriptionPayment, ensureCustomer, type AsaasPayment } from "@/lib/asaas";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { evaluateAccess, isOwnerEmail, type Access } from "@/lib/subscription-access";
import { isValidCpfCnpj } from "@/lib/validation/cnpj";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type PlanInterval = "monthly" | "annual";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The store's subscription as seen by this user (RLS lets any store member read it).
 * Pass the user's own client; defaults to the service role for server code without a session.
 */
export async function loadSubscription(
  userId: string,
  supabase: SupabaseClient<Database> = createAdminClient()
): Promise<StoreSubscription | null> {
  // One round trip: the user's first store and its subscription (one per store).
  const { data } = await supabase
    .from("store_users")
    .select("stores(subscriptions(*, plans(name, interval)))")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const store = data?.stores as { subscriptions: StoreSubscription | StoreSubscription[] | null } | null | undefined;
  const sub = store?.subscriptions;
  return (Array.isArray(sub) ? sub[0] : sub) ?? null;
}

export type StoreSubscription = Subscription & { plans: { name: string; interval: string | null } | null };

/**
 * Access for a user. Pass the email when it is already known (the middleware reads it from the verified JWT);
 * otherwise it is looked up with the given client. The owner email never depends on subscription data.
 */
export async function checkAccess(
  userId: string,
  supabase?: SupabaseClient<Database>,
  email?: string | null
): Promise<Access> {
  const userEmail = email !== undefined ? email : supabase ? (await supabase.auth.getUser()).data.user?.email : null;
  if (isOwnerEmail(userEmail)) return { access: "full", type: "owner" };
  return evaluateAccess(await loadSubscription(userId, supabase));
}

export class CheckoutError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/** Creates the Asaas charge for a plan and returns the invoice URL the user pays on. */
export async function startCheckout(
  supabase: SupabaseClient<Database>,
  user: { id: string; email?: string },
  interval: PlanInterval
): Promise<string> {
  if (!process.env.ASAAS_API_KEY) throw new CheckoutError("Pagamentos indisponíveis no momento", 503);
  if (!user.email) throw new CheckoutError("Sua conta não tem email", 400);
  if (isOwnerEmail(user.email)) throw new CheckoutError("Esta é a conta proprietária: o acesso já é permanente", 409);

  const { data: membership } = await supabase
    .from("store_users")
    .select("store_id, role, stores(name, cnpj)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!membership) throw new CheckoutError("Loja não encontrada", 404);
  if (!["owner", "admin"].includes(membership.role)) {
    throw new CheckoutError("Só o dono da loja pode assinar um plano", 403);
  }

  const admin = createAdminClient();
  const [{ data: plan }, { data: existing }] = await Promise.all([
    admin.from("plans").select("id, price").eq("interval", interval).eq("is_active", true).limit(1).maybeSingle(),
    admin.from("subscriptions").select("*").eq("store_id", membership.store_id).maybeSingle(),
  ]);
  if (!plan) throw new CheckoutError("Plano indisponível", 404);

  const current = evaluateAccess(existing);
  if (existing?.status === "active" && current.access === "full") {
    throw new CheckoutError("Sua loja já tem um plano ativo", 409);
  }

  const store = membership.stores as { name: string; cnpj: string | null } | null;
  if (!store?.cnpj || !isValidCpfCnpj(store.cnpj)) {
    throw new CheckoutError("Informe o CPF ou CNPJ da loja em Configurações > Minha Loja para assinar.", 400);
  }
  const customerId = await ensureCustomer({
    customerId: existing?.asaas_customer_id,
    name: store.name,
    email: user.email,
    cpfCnpj: store.cnpj,
  });

  // A checkout started earlier and abandoned would stay open: drop it first.
  await cancelOpenCharges(existing);

  // Both plans start with a one-off charge. The monthly recurrence is only created by the webhook once this first
  // charge is paid (startMonthlyRecurrence), so an unpaid checkout never schedules future charges.
  const payment = await asaasFetch<AsaasPayment>("/payments", {
    method: "POST",
    body: JSON.stringify(
      interval === "monthly"
        ? {
            customer: customerId,
            billingType: "UNDEFINED",
            value: Number(plan.price),
            dueDate: brazilDate(3),
            description: "Plano Mensal useFindash — Primeiro mês",
            externalReference: user.id,
          }
        : {
            customer: customerId,
            billingType: "UNDEFINED",
            value: Number(plan.price),
            dueDate: brazilDate(3),
            description: "Plano Anual useFindash - 12 meses",
            externalReference: membership.store_id,
          }
    ),
  });

  const row = {
    asaas_payment_id: payment.id,
    asaas_subscription_id: null,
    store_id: membership.store_id,
    user_id: existing?.user_id ?? user.id,
    plan_id: plan.id,
    status: "pending",
    asaas_customer_id: customerId,
    updated_at: new Date().toISOString(),
  };
  const { error } = await admin.from("subscriptions").upsert(row, { onConflict: "store_id" });
  if (error) throw new CheckoutError("Cobrança criada, mas falhou ao salvar a assinatura", 500);

  return payment.invoiceUrl;
}

/** The monthly recurrence, created once the first month is paid: its first charge is due 30 days from today. */
export async function startMonthlyRecurrence(input: {
  customerId: string;
  userId: string | null;
  price: number;
}): Promise<string> {
  const created = await asaasFetch<{ id: string }>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: input.customerId,
      billingType: "UNDEFINED",
      value: input.price,
      nextDueDate: brazilDate(30),
      cycle: "MONTHLY",
      description: "Plano Mensal useFindash — Recorrência",
      externalReference: input.userId ?? undefined,
    }),
  });
  return created.id;
}

/** A paid event for the monthly plan's first one-off charge, before the recurrence exists. */
export function isFirstMonthlyPayment(
  event: AsaasWebhookEvent,
  sub: Pick<Subscription, "status" | "asaas_payment_id" | "asaas_subscription_id">,
  planInterval: string | null
): boolean {
  const paid = event.event === "PAYMENT_RECEIVED" || event.event === "PAYMENT_CONFIRMED";
  return (
    paid &&
    planInterval === "monthly" &&
    sub.status === "pending" &&
    !sub.asaas_subscription_id &&
    !!event.payment?.id &&
    sub.asaas_payment_id === event.payment.id
  );
}

async function cancelOpenCharges(existing: Subscription | null) {
  if (!existing || existing.status === "active") return;
  try {
    if (existing.asaas_subscription_id) {
      await asaasFetch(`/subscriptions/${existing.asaas_subscription_id}`, { method: "DELETE" });
    } else if (existing.asaas_payment_id) {
      await asaasFetch(`/payments/${existing.asaas_payment_id}`, { method: "DELETE" });
    }
  } catch {
    // Already paid, removed or never existed in this Asaas environment: nothing left to cancel.
  }
}

/** Invoice page for the charge the store should pay now (overdue first), or the latest one. */
export async function currentInvoiceUrl(sub: Subscription | null): Promise<string | null> {
  if (!sub || !process.env.ASAAS_API_KEY) return null;
  if (sub.asaas_subscription_id) {
    return (await currentSubscriptionPayment(sub.asaas_subscription_id))?.invoiceUrl ?? null;
  }
  if (sub.asaas_payment_id) {
    return (await asaasFetch<AsaasPayment>(`/payments/${sub.asaas_payment_id}`)).invoiceUrl ?? null;
  }
  return null;
}

// ---------------------------------------------------------------------------------------------------------------
// Webhook rules

export interface AsaasWebhookEvent {
  id?: string;
  event: string;
  payment?: { id: string; customer?: string; subscription?: string | null; value?: number; status?: string };
  subscription?: { id: string; customer?: string };
}

/** Row fields to write for an event on this subscription, or null when the event changes nothing. */
export function subscriptionUpdateForEvent(
  event: AsaasWebhookEvent,
  sub: Pick<Subscription, "status" | "asaas_payment_id" | "asaas_subscription_id" | "trial_end"> &
    Partial<Pick<Subscription, "current_period_end">>,
  planInterval: string | null,
  now: Date = new Date()
): Partial<Subscription> | null {
  const stamp = now.toISOString();

  switch (event.event) {
    case "PAYMENT_RECEIVED":
    case "PAYMENT_CONFIRMED": {
      const paymentId = event.payment?.id ?? null;
      // Card charges send CONFIRMED and later RECEIVED for the same payment: only the first one extends access.
      if (sub.status === "active" && paymentId && sub.asaas_payment_id === paymentId) return null;
      const days = planInterval === "annual" ? 365 : 30;
      // A renewal adds to the period already paid, so paying before the due date does not shorten it; a first
      // payment, or one after the period ran out, counts from today.
      const paidUntil = sub.current_period_end ? new Date(sub.current_period_end).getTime() : 0;
      const renewing = (sub.status === "active" || sub.status === "overdue") && paidUntil > now.getTime();
      const from = renewing ? paidUntil : now.getTime();
      return {
        status: "active",
        asaas_payment_id: paymentId ?? sub.asaas_payment_id,
        current_period_start: stamp,
        current_period_end: new Date(from + days * DAY_MS).toISOString(),
        updated_at: stamp,
      };
    }

    case "PAYMENT_OVERDUE":
      // Only a paying store falls behind. An abandoned first checkout stays pending, so access still ends with
      // the trial instead of gaining the overdue grace days.
      if (sub.status !== "active") return null;
      return { status: "overdue", updated_at: stamp };

    case "SUBSCRIPTION_INACTIVATED":
    case "SUBSCRIPTION_DELETED":
      return { status: "cancelled", updated_at: stamp };

    case "PAYMENT_DELETED":
      // Only the first one-off charge (either plan), while still unpaid. A trial that has not ended yet keeps running.
      if (sub.status !== "pending" || !sub.asaas_payment_id || sub.asaas_payment_id !== event.payment?.id) return null;
      if (sub.trial_end && new Date(sub.trial_end) > now) return { status: "trial", updated_at: stamp };
      return { status: "cancelled", updated_at: stamp };

    default:
      return null;
  }
}
