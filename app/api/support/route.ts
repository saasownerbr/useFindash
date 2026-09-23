import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, whatsapp } = body;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Get store info
    const { data: storeUsers } = await supabase
      .from("store_users")
      .select("id, name, store_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!storeUsers) {
      return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
    }

    const { data: store } = await supabase
      .from("stores")
      .select("name")
      .eq("id", storeUsers.store_id)
      .single();

    const supportEmail = process.env.SUPPORT_EMAIL;
    if (!supportEmail) {
      return NextResponse.json({ error: "Email de suporte não configurado" }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "suporte@usefindash.vercel.app",
      to: supportEmail,
      replyTo: user.email || undefined,
      subject: `Solicitação de Suporte - ${store?.name || "useFindash"}`,
      html: `
        <h2>Nova Solicitação de Suporte</h2>
        <p><strong>Loja:</strong> ${store?.name || "N/A"}</p>
        <p><strong>Usuário:</strong> ${storeUsers.name}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>WhatsApp:</strong> ${whatsapp}</p>
        <hr />
        <p><strong>Descrição do Problema:</strong></p>
        <p>${description.replace(/\n/g, "<br />")}</p>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Support email error:", error);
    return NextResponse.json({ error: "Falha ao enviar suporte" }, { status: 500 });
  }
}
