import type { AuthError } from "@supabase/supabase-js";

export function authErrorMessage(error: AuthError) {
  switch (error.code) {
    case "invalid_credentials":
      return "Email ou senha incorretos.";
    case "user_already_exists":
    case "email_exists":
      return "Este email já tem uma conta. Entre pela tela de login.";
    case "email_address_invalid":
      return "Digite um email válido.";
    case "weak_password":
      return "Senha muito fraca. Use pelo menos 8 caracteres, com letras, números e símbolos.";
    case "email_not_confirmed":
      return "Este email ainda não foi confirmado. Fale com o suporte.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.";
  }
  if (error.status === 429) return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.";
  return "Não foi possível concluir agora. Tente novamente.";
}
