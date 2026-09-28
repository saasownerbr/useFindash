import { emailParagraph, escapeHtml, renderEmail } from "@/lib/email-layout";

/**
 * Sender for customer-facing email. Resend only delivers from a domain verified in the account,
 * so byfindash.com.br must stay verified there; RESEND_FROM_EMAIL overrides it per environment.
 */
export const DEFAULT_EMAIL_FROM = "useFindash <noreply@byfindash.com.br>";

export function emailFrom() {
  return process.env.RESEND_FROM_EMAIL || DEFAULT_EMAIL_FROM;
}

export const WELCOME_EMAIL_SUBJECT = "Bem-vindo ao useFindash";

/** Subject and HTML body of the email a new owner gets once their store is created. */
export function buildWelcomeEmail({ ownerName, storeName, appUrl }: { ownerName: string; storeName: string; appUrl: string }) {
  const firstName = escapeHtml(ownerName.trim().split(/\s+/)[0] ?? "");
  const dashboardUrl = `${appUrl.replace(/\/$/, "")}/dashboard`;

  return {
    subject: WELCOME_EMAIL_SUBJECT,
    html: renderEmail({
      preheader: "Sua loja está pronta e o teste grátis de 7 dias já começou.",
      title: firstName ? `Olá, ${firstName}!` : "Olá!",
      bodyHtml: [
        emailParagraph(`A loja <strong style="color:#F0F0F0;">${escapeHtml(storeName)}</strong> está pronta no useFindash.`),
        emailParagraph(
          "Seu período de teste de <strong style=\"color:#dae878;\">7 dias</strong> já começou. Cadastre o estoque, registre as vendas e acompanhe o lucro real da loja no painel."
        ),
      ].join(""),
      cta: { label: "Abrir o painel", url: dashboardUrl },
      footnoteHtml: "Dúvidas? Responda este email ou use o Suporte dentro do sistema.",
    }),
  };
}
