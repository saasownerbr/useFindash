import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStoreOwnerEmails, listAllUserEmails } from "@/lib/store-owners";
import { isInUpgradeWindow } from "@/lib/customer-alerts";
import { verifyCronSecret } from "@/lib/cron-auth";
import { formatPhone } from "@/lib/phone";

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data: stores } = await admin.from("stores").select("id, name, upgrade_alert_months");
  const emailById = await listAllUserEmails(admin);
  let emailsSent = 0;

  for (const store of stores ?? []) {
    const { data: customers } = await admin.from("customers").select("id, name, whatsapp").eq("store_id", store.id);
    if (!customers || customers.length === 0) continue;

    const { data: sales } = await admin
      .from("sales")
      .select("customer_id, sold_at, products(model)")
      .eq("store_id", store.id)
      .order("sold_at", { ascending: false });

    const latestSaleByCustomer = new Map<string, { sold_at: string; model: string | null }>();
    for (const sale of sales ?? []) {
      if (!latestSaleByCustomer.has(sale.customer_id)) {
        latestSaleByCustomer.set(sale.customer_id, {
          sold_at: sale.sold_at,
          model: (sale.products as { model: string } | null)?.model ?? null,
        });
      }
    }

    const inWindow = customers.filter((customer) => {
      const lastSale = latestSaleByCustomer.get(customer.id);
      return isInUpgradeWindow(lastSale?.sold_at ?? null, store.upgrade_alert_months ?? 20);
    });

    if (inWindow.length === 0) continue;

    const ownerEmails = await getStoreOwnerEmails(admin, store.id, emailById);
    if (ownerEmails.length === 0) continue;

    const rows = inWindow
      .map((customer) => {
        const lastSale = latestSaleByCustomer.get(customer.id);
        const model = lastSale?.model ?? "produto";
        const date = lastSale ? new Date(lastSale.sold_at).toLocaleDateString("pt-BR") : "—";
        return `<li>${customer.name} — ${model} — ${date} — ${formatPhone(customer.whatsapp)}</li>`;
      })
      .join("");

    await resend.emails.send({
      from: "useFindash <alertas@usefindash.vercel.app>",
      to: ownerEmails,
      subject: `Clientes em janela de upgrade — ${store.name}`,
      html: `<p>Clientes em janela de upgrade:</p><ul>${rows}</ul>`,
    });
    emailsSent += 1;
  }

  return NextResponse.json({ ok: true, emailsSent });
}
