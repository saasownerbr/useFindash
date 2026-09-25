import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { currentInvoiceUrl, loadSubscription } from "@/lib/subscription";

export const dynamic = "force-dynamic";

/** The Asaas invoice page to pay (overdue charge first) or review the current plan's payment. */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const invoiceUrl = await currentInvoiceUrl(await loadSubscription(user.id, supabase));
    if (!invoiceUrl) return NextResponse.json({ error: "Nenhuma cobrança encontrada" }, { status: 404 });
    return NextResponse.json({ invoiceUrl });
  } catch (error) {
    console.error("[asaas] invoice lookup failed", error);
    return NextResponse.json({ error: "Não foi possível abrir a cobrança" }, { status: 502 });
  }
}
