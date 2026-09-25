import type { SupabaseClient } from "@supabase/supabase-js";

import { asaasFetch, brazilDate, currentSubscriptionPayment, findOrCreateCustomer, type AsaasPayment } from "@/lib/asaas";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { evaluateAccess, type Access } from "@/lib/subscription-access";

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

export async function checkAccess(userId: string, supabase?: SupabaseClient<Database>): Promise<Access> {
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
  const customerId =
    existing?.asaas_customer_id ??
    (await findOrCreateCustomer({ name: store?.name ?? user.email, email: user.email, cpfCnpj: store?.cnpj }));

  // A checkout started earlier and abandoned would keep charging (monthly) or stay open (annual): drop it first.
  await cancelOpenCharges(existing);

  let invoiceUrl: string;
  let fields: Partial<Subscription>;
  if (interval === "monthly") {
    const created = await asaasFetch<{ id: string }>("/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        customer: customerId,
        billingType: "CREDIT_CARD",
        value: Number(plan.price),
        nextDueDate: brazilDate(),
        cycle: "MONTHLY",
        description: "Plano Mensal useFindash",
        externalReference: membership.store_id,
      }),
    });
    const payment = await currentSubscriptionPayment(created.id);
    if (!payment) throw new CheckoutError("Não foi possível gerar a cobrança", 502);
    invoiceUrl = payment.invoiceUrl;
    fields = { asaas_subscription_id: created.id, asaas_payment_id: null };
  } else {
    const payment = await asaasFetch<AsaasPayment>("/payments", {
      method: "POST",
      body: JSON.stringify({
        customer: customerId,
        billingType: "UNDEFINED",
        value: Number(plan.price),
        dueDate: brazilDate(3),
        description: "Plano Anual useFindash - 12 meses",
        externalReference: membership.store_id,
      }),
    });
    invoiceUrl = payment.invoiceUrl;
    fields = { asaas_payment_id: payment.id, asaas_subscription_id: null };
  }

  const row = {
    ...fields,
    store_id: membership.store_id,
    user_id: existing?.user_id ?? user.id,
    plan_id: plan.id,
    status: "pending",
    asaas_customer_id: customerId,
    updated_at: new Date().toISOString(),
  };
  const { error } = await admin.from("subscriptions").upsert(row, { onConflict: "store_id" });
  if (error) throw new CheckoutError("Cobrança criada, mas falhou ao salvar a assinatura", 500);

  return invoiceUrl;
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
  sub: Pick<Subscription, "status" | "asaas_payment_id" | "asaas_subscription_id" | "trial_end">,
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
      return {
        status: "active",
        asaas_payment_id: paymentId ?? sub.asaas_payment_id,
        current_period_start: stamp,
        current_period_end: new Date(now.getTime() + days * DAY_MS).toISOString(),
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
      // Only the annual one-off charge, while still unpaid. A trial that has not ended yet keeps running.
      if (sub.status !== "pending" || !sub.asaas_payment_id || sub.asaas_payment_id !== event.payment?.id) return null;
      if (sub.trial_end && new Date(sub.trial_end) > now) return { status: "trial", updated_at: stamp };
      return { status: "cancelled", updated_at: stamp };

    default:
      return null;
  }
}
