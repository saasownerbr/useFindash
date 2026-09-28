import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { buildUpgradeAlertEmail } from "@/lib/alert-emails";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStoreOwnerEmails, listAllUserEmails } from "@/lib/store-owners";
import { isInUpgradeWindow } from "@/lib/customer-alerts";
import { verifyCronSecret } from "@/lib/cron-auth";
import { emailFrom } from "@/lib/welcome-email";

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data: stores } = await admin.from("stores").select("id, name, upgrade_alert_months");
  const emailById = await listAllUserEmails(admin);
  let emailsSent = 0;
  let failures = 0;

  for (const store of stores ?? []) {
    const { data: customers } = await admin.from("customers").select("id, name, whatsapp").eq("store_id", store.id);
    if (!customers || customers.length === 0) continue;

    // Only device sales: an accessory bought later does not restart the upgrade clock.
    const { data: sales } = await admin
      .from("sales")
      .select("customer_id, sold_at, products(model)")
      .eq("store_id", store.id)
      .not("product_id", "is", null)
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

    const { subject, html } = buildUpgradeAlertEmail(
      store.name,
      inWindow.map((customer) => {
        const lastSale = latestSaleByCustomer.get(customer.id)!;
        return { name: customer.name, whatsapp: customer.whatsapp, model: lastSale.model, soldAt: lastSale.sold_at };
      })
    );

    const { error } = await resend.emails.send({ from: emailFrom(), to: ownerEmails, subject, html });
    if (error) {
      failures += 1;
      console.error("Upgrade alert email error:", store.id, error);
      continue;
    }
    emailsSent += 1;
  }

  return NextResponse.json({ ok: failures === 0, emailsSent, failures });
}
