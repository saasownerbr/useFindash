import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { buildSupportEmail } from "@/lib/support-email";
import { createClient } from "@/lib/supabase/server";
import { getActiveStoreId } from "@/lib/supabase/store";
import { supportSchema } from "@/lib/validation/support";
import { emailFrom } from "@/lib/welcome-email";

// Support mail goes out from the verified byfindash.com.br sender (SUPPORT_FROM_EMAIL overrides it) to SUPPORT_EMAIL,
// with Reply-To set to the user so answering reaches them directly.
const DEFAULT_SUPPORT_EMAIL = "saas.owner.br@gmail.com";

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

  const supportEmail = process.env.SUPPORT_EMAIL || DEFAULT_SUPPORT_EMAIL;
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
    from: process.env.SUPPORT_FROM_EMAIL || emailFrom(),
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
