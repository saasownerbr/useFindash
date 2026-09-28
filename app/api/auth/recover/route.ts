import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { buildPasswordResetEmail, passwordResetUrl } from "@/lib/password-reset-email";
import { createAdminClient } from "@/lib/supabase/admin";
import { recoverPasswordSchema } from "@/lib/validation/auth";
import { emailFrom } from "@/lib/welcome-email";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.byfindash.com.br";
/** One reset email per account per minute, so the form can't be used to flood someone's inbox. */
const COOLDOWN_MS = 60 * 1000;

/**
 * Password recovery email in Portuguese, sent through Resend from noreply@byfindash.com.br instead of Supabase's
 * default English template. Always answers { ok: true } for a valid email, so the form never reveals which emails
 * have an account.
 */
export async function POST(request: NextRequest) {
  const parsed = recoverPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Digite um email válido." }, { status: 400 });
  }
  if (!process.env.RESEND_API_KEY) {
    console.error("Password reset: RESEND_API_KEY is not set");
    return NextResponse.json({ error: "Email não configurado" }, { status: 500 });
  }

  const email = parsed.data.email.toLowerCase();
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email });
  // No account with this email (or Auth refused): same answer as a success.
  if (error || !data.properties?.hashed_token || !data.user) {
    return NextResponse.json({ ok: true });
  }

  const lastSent = Number((data.user.app_metadata as { recovery_email_sent_at?: number } | undefined)?.recovery_email_sent_at ?? 0);
  if (Date.now() - lastSent < COOLDOWN_MS) {
    return NextResponse.json({ ok: true });
  }

  const { subject, html } = buildPasswordResetEmail({ resetUrl: passwordResetUrl(APP_URL, data.properties.hashed_token) });
  const { error: sendError } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: emailFrom(),
    to: email,
    subject,
    html,
  });
  if (sendError) {
    console.error("Password reset email error:", sendError);
    return NextResponse.json({ error: "Não foi possível enviar o email. Tente novamente." }, { status: 502 });
  }

  await admin.auth.admin.updateUserById(data.user.id, {
    app_metadata: { ...data.user.app_metadata, recovery_email_sent_at: Date.now() },
  });

  return NextResponse.json({ ok: true });
}
