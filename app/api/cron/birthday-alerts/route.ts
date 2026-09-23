import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { createAdminClient } from "@/lib/supabase/admin";
import { isBirthdayWithinDays } from "@/lib/customer-alerts";
import { verifyCronSecret } from "@/lib/cron-auth";

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data: stores } = await admin.from("stores").select("id, name");
  let emailsSent = 0;

  for (const store of stores ?? []) {
    const { data: customers } = await admin
      .from("customers")
      .select("id, name, whatsapp, birthdate")
      .eq("store_id", store.id);
    if (!customers || customers.length === 0) continue;

    const upcoming = customers.filter((customer) => isBirthdayWithinDays(customer.birthdate, 7));
    if (upcoming.length === 0) continue;

    const { data: owners } = await admin
      .from("store_users")
      .select("user_id")
      .eq("store_id", store.id)
      .in("role", ["owner", "admin"]);
    const { data: authUsers } = await admin.auth.admin.listUsers();
    const ownerEmails = (owners ?? [])
      .map((o) => authUsers?.users.find((u) => u.id === o.user_id)?.email)
      .filter((email): email is string => Boolean(email));
    if (ownerEmails.length === 0) continue;

    const rows = upcoming
      .map((customer) => {
        const date = customer.birthdate ? new Date(customer.birthdate).toLocaleDateString("pt-BR") : "—";
        return `<li>${customer.name} — aniversário em ${date} — ${customer.whatsapp}</li>`;
      })
      .join("");

    await resend.emails.send({
      from: "useFindash <alertas@usefindash.vercel.app>",
      to: ownerEmails,
      subject: `Aniversariantes dos próximos 7 dias — ${store.name}`,
      html: `<p>Aniversariantes dos próximos 7 dias:</p><ul>${rows}</ul>`,
    });
    emailsSent += 1;
  }

  return NextResponse.json({ ok: true, emailsSent });
}
