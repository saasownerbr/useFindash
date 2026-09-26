import { NextResponse } from "next/server";
import { Resend } from "resend";

import { createClient } from "@/lib/supabase/server";
import { getActiveStoreId } from "@/lib/supabase/store";
import { buildWelcomeEmail, emailFrom } from "@/lib/welcome-email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.byfindash.com.br";

/** Called by the onboarding page right after the store is created; only ever emails the signed-in user. */
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("Welcome email: RESEND_API_KEY is not set");
    return NextResponse.json({ error: "Email não configurado" }, { status: 500 });
  }

  const storeId = await getActiveStoreId(supabase, user.id);
  if (!storeId) {
    return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
  }

  const [{ data: store }, { data: owner }] = await Promise.all([
    supabase.from("stores").select("name").eq("id", storeId).single(),
    supabase.from("store_users").select("name").eq("store_id", storeId).eq("user_id", user.id).maybeSingle(),
  ]);

  const { subject, html } = buildWelcomeEmail({
    ownerName: owner?.name ?? "",
    storeName: store?.name ?? "sua loja",
    appUrl: APP_URL,
  });

  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: emailFrom(),
    to: user.email,
    subject,
    html,
  });

  if (error) {
    console.error("Welcome email error:", error);
    return NextResponse.json({ error: "Falha ao enviar" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
