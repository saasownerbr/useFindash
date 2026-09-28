import { emailParagraph, renderEmail } from "@/lib/email-layout";

export const PASSWORD_RESET_SUBJECT = "Redefinição de senha — useFindash";

/** Link the email points to: /auth/callback verifies the one-time token and opens /redefinir-senha signed in. */
export function passwordResetUrl(appUrl: string, hashedToken: string) {
  const params = new URLSearchParams({ token_hash: hashedToken, type: "recovery", next: "/redefinir-senha" });
  return `${appUrl.replace(/\/$/, "")}/auth/callback?${params.toString()}`;
}

export function buildPasswordResetEmail({ resetUrl }: { resetUrl: string }) {
  return {
    subject: PASSWORD_RESET_SUBJECT,
    html: renderEmail({
      preheader: "Use o link para criar uma nova senha. Ele vale por 1 hora.",
      title: "Redefinição de senha",
      bodyHtml: [
        emailParagraph("Recebemos um pedido para redefinir a senha da sua conta no useFindash."),
        emailParagraph("Clique no botão abaixo para criar uma nova senha. O link vale por 1 hora e só pode ser usado uma vez."),
      ].join(""),
      cta: { label: "Criar nova senha", url: resetUrl },
      footnoteHtml:
        "Se você não pediu a redefinição, ignore este email: sua senha continua a mesma.",
    }),
  };
}
