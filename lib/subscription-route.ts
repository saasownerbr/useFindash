import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { CheckoutError, startCheckout, type PlanInterval } from "@/lib/subscription";

/** POST handler shared by /api/subscription/monthly and /annual. */
export async function checkoutRoute(interval: PlanInterval) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const invoiceUrl = await startCheckout(supabase, user, interval);
    return NextResponse.json({ invoiceUrl });
  } catch (error) {
    if (error instanceof CheckoutError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("[asaas] checkout failed", error);
    return NextResponse.json({ error: "Não foi possível iniciar o pagamento. Tente novamente." }, { status: 502 });
  }
}
