import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { asaasFetch } from "@/lib/asaas";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, Tables } from "@/lib/supabase/types";
import {
  isFirstMonthlyPayment,
  startMonthlyRecurrence,
  subscriptionUpdateForEvent,
  type AsaasWebhookEvent,
} from "@/lib/subscription";

export const dynamic = "force-dynamic";

function validToken(received: string | null): boolean {
  const expected = process.env.ASAAS_WEBHOOK_SECRET;
  if (!expected || !received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const SUBSCRIPTION_COLUMNS =
  "id, status, user_id, asaas_customer_id, asaas_payment_id, asaas_subscription_id, trial_end, current_period_end, plans(interval, price)";

export async function POST(request: NextRequest) {
  if (!validToken(request.headers.get("asaas-access-token"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let event: AsaasWebhookEvent;
  try {
    event = await request.json();
  } catch {
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();

  try {
    // Find the store's subscription: Asaas subscription id (monthly), payment id (annual), then customer (paid only).
    const subscriptionId = event.subscription?.id ?? event.payment?.subscription ?? null;
    let sub = null;
    if (subscriptionId) {
      ({ data: sub } = await admin.from("subscriptions").select(SUBSCRIPTION_COLUMNS).eq("asaas_subscription_id", subscriptionId).maybeSingle());
    } else if (event.payment?.id) {
      ({ data: sub } = await admin.from("subscriptions").select(SUBSCRIPTION_COLUMNS).eq("asaas_payment_id", event.payment.id).maybeSingle());
    }
    const isPaid = event.event === "PAYMENT_RECEIVED" || event.event === "PAYMENT_CONFIRMED";
    if (!sub && isPaid && event.payment?.customer) {
      ({ data: sub } = await admin
        .from("subscriptions")
        .select(SUBSCRIPTION_COLUMNS)
        .eq("asaas_customer_id", event.payment.customer)
        .limit(1)
        .maybeSingle());
    }

    // Asaas redelivers until it gets a 200; the unique event id turns a redelivery into a no-op.
    const { error: logError } = await admin.from("payment_events").insert({
      subscription_id: sub?.id ?? null,
      asaas_event_id: event.id ?? null,
      event_type: event.event,
      status: event.payment?.status ?? null,
      value: event.payment?.value ?? null,
      payload: event as unknown as Json,
    });
    if (logError?.code === "23505") return NextResponse.json({ received: true, duplicate: true });

    if (sub) {
      const plan = sub.plans as { interval: string | null; price: number } | null;
      const interval = plan?.interval ?? null;
      const update = subscriptionUpdateForEvent(event, sub, interval);
      if (update && isFirstMonthlyPayment(event, sub, interval)) {
        await activateMonthly(admin, sub, update, Number(plan?.price));
      } else if (update) {
        await admin.from("subscriptions").update(update).eq("id", sub.id);
      }
    }
  } catch (error) {
    console.error("[asaas] webhook processing failed", event.event, error);
  }

  return NextResponse.json({ received: true });
}

/**
 * First month paid: only now create the Asaas recurrence, then activate. Card payments send CONFIRMED and RECEIVED
 * close together, so the row is only claimed while it has no recurrence yet; a request that loses that race removes
 * the recurrence it just created. If Asaas refuses, the month is still paid: activate anyway and log it.
 */
async function activateMonthly(
  admin: ReturnType<typeof createAdminClient>,
  sub: { id: string; user_id: string | null; asaas_customer_id: string | null },
  update: Partial<Tables<"subscriptions">>,
  price: number
) {
  let recurrenceId: string | null = null;
  if (sub.asaas_customer_id && price > 0) {
    try {
      recurrenceId = await startMonthlyRecurrence({ customerId: sub.asaas_customer_id, userId: sub.user_id, price });
    } catch (error) {
      console.error("[asaas] first month paid but the recurrence was not created", sub.id, error);
    }
  } else {
    console.error("[asaas] first month paid without customer or price, recurrence not created", sub.id);
  }

  const { data: claimed } = await admin
    .from("subscriptions")
    .update({ ...update, ...(recurrenceId ? { asaas_subscription_id: recurrenceId } : {}) })
    .eq("id", sub.id)
    .is("asaas_subscription_id", null)
    .select("id");

  if (recurrenceId && (claimed ?? []).length === 0) {
    await asaasFetch(`/subscriptions/${recurrenceId}`, { method: "DELETE" }).catch((error) =>
      console.error("[asaas] duplicate recurrence could not be removed", recurrenceId, error)
    );
  }
}
