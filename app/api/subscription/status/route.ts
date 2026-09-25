import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { loadSubscription } from "@/lib/subscription";
import { evaluateAccess, isOwnerEmail } from "@/lib/subscription-access";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const sub = await loadSubscription(user.id, supabase);
  return NextResponse.json({
    status: sub?.status ?? null,
    plan: sub?.plans ? { name: sub.plans.name, interval: sub.plans.interval } : null,
    trial_end: sub?.trial_end ?? null,
    current_period_end: sub?.current_period_end ?? null,
    access: isOwnerEmail(user.email) ? { access: "full", type: "owner" } : evaluateAccess(sub),
  });
}
