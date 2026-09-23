import type { AuthError } from "@supabase/supabase-js";

export function magicLinkRedirectUrl() {
  return `${window.location.origin}/auth/callback`;
}

export function magicLinkErrorMessage(error: AuthError) {
  if (error.code === "otp_disabled") {
    return "Não encontramos uma conta com esse email. Crie uma conta para começar.";
  }
  if (error.status === 429 || error.code === "over_email_send_rate_limit") {
    return "Muitos envios em pouco tempo. Aguarde alguns minutos e tente de novo.";
  }
  return "Não foi possível enviar o link. Tente novamente.";
}
