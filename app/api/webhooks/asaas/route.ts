import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";
import { subscriptionUpdateForEvent, type AsaasWebhookEvent } from "@/lib/subscription";

export const dynamic = "force-dynamic";

function validToken(received: string | null): boolean {
  const expected = process.env.ASAAS_WEBHOOK_SECRET;
  if (!expected || !received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const SUBSCRIPTION_COLUMNS = "id, status, asaas_payment_id, asaas_subscription_id, trial_end, plans(interval)";

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
      const plan = sub.plans as { interval: string | null } | null;
      const update = subscriptionUpdateForEvent(event, sub, plan?.interval ?? null);
      if (update) await admin.from("subscriptions").update(update).eq("id", sub.id);
    }
  } catch (error) {
    console.error("[asaas] webhook processing failed", event.event, error);
  }

  return NextResponse.json({ received: true });
}
