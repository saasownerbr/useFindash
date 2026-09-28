import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { buildBirthdayAlertEmail } from "@/lib/alert-emails";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStoreOwnerEmails, listAllUserEmails } from "@/lib/store-owners";
import { isBirthdayWithinDays } from "@/lib/customer-alerts";
import { verifyCronSecret } from "@/lib/cron-auth";
import { emailFrom } from "@/lib/welcome-email";

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data: stores } = await admin.from("stores").select("id, name");
  const emailById = await listAllUserEmails(admin);
  let emailsSent = 0;
  let failures = 0;

  for (const store of stores ?? []) {
    const { data: customers } = await admin
      .from("customers")
      .select("id, name, whatsapp, birthdate")
      .eq("store_id", store.id);
    if (!customers || customers.length === 0) continue;

    const upcoming = customers.filter((customer) => isBirthdayWithinDays(customer.birthdate, 7));
    if (upcoming.length === 0) continue;

    const ownerEmails = await getStoreOwnerEmails(admin, store.id, emailById);
    if (ownerEmails.length === 0) continue;

    const { subject, html } = buildBirthdayAlertEmail(
      store.name,
      upcoming.map((customer) => ({ name: customer.name, whatsapp: customer.whatsapp, birthdate: customer.birthdate! }))
    );

    const { error } = await resend.emails.send({ from: emailFrom(), to: ownerEmails, subject, html });
    if (error) {
      failures += 1;
      console.error("Birthday alert email error:", store.id, error);
      continue;
    }
    emailsSent += 1;
  }

  return NextResponse.json({ ok: failures === 0, emailsSent, failures });
}
