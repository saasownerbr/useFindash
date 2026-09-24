import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { buildSupportEmail } from "@/lib/support-email";
import { createClient } from "@/lib/supabase/server";
import { getActiveStoreId } from "@/lib/supabase/store";
import { supportSchema } from "@/lib/validation/support";

// Resend only sends from verified domains; until one is set up, its shared
// sender works for the account owner's inbox (which is where SUPPORT_EMAIL points).
const DEFAULT_FROM = "useFindash <onboarding@resend.dev>";

export async function POST(request: NextRequest) {
  const parsed = supportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const supportEmail = process.env.SUPPORT_EMAIL;
  if (!supportEmail || !process.env.RESEND_API_KEY) {
    console.error("Support email: SUPPORT_EMAIL or RESEND_API_KEY is not set");
    return NextResponse.json({ error: "Suporte não configurado" }, { status: 500 });
  }

  const storeId = await getActiveStoreId(supabase, user.id);
  const { data: store } = storeId
    ? await supabase.from("stores").select("name").eq("id", storeId).single()
    : { data: null };

  const { subject, html } = buildSupportEmail({
    storeName: store?.name ?? "Loja sem nome",
    userEmail: user.email,
    whatsapp: parsed.data.whatsapp,
    message: parsed.data.description,
    sentAt: new Date(),
  });

  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: process.env.SUPPORT_FROM_EMAIL || DEFAULT_FROM,
    to: supportEmail,
    replyTo: user.email,
    subject,
    html,
  });

  if (error) {
    console.error("Support email error:", error);
    return NextResponse.json({ error: "Falha ao enviar" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
