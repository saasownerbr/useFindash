/**
 * Sender for customer-facing email. Resend only delivers from a domain verified in the account,
 * so byfindash.com.br must stay verified there; RESEND_FROM_EMAIL overrides it per environment.
 */
export const DEFAULT_EMAIL_FROM = "useFindash <noreply@byfindash.com.br>";

export function emailFrom() {
  return process.env.RESEND_FROM_EMAIL || DEFAULT_EMAIL_FROM;
}

export const WELCOME_EMAIL_SUBJECT = "Bem-vindo ao useFindash";

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Subject and HTML body of the email a new owner gets once their store is created. */
export function buildWelcomeEmail({ ownerName, storeName, appUrl }: { ownerName: string; storeName: string; appUrl: string }) {
  const firstName = escapeHtml(ownerName.trim().split(/\s+/)[0] ?? "");
  const dashboardUrl = `${appUrl.replace(/\/$/, "")}/dashboard`;

  return {
    subject: WELCOME_EMAIL_SUBJECT,
    html: [
      `<h2>Olá, ${firstName}!</h2>`,
      `<p>A loja <strong>${escapeHtml(storeName)}</strong> está pronta no useFindash.</p>`,
      "<p>Seu período de teste de 7 dias já começou. Cadastre o estoque, registre as vendas e acompanhe o lucro real da loja no painel.</p>",
      `<p><a href="${dashboardUrl}">Abrir o painel</a></p>`,
      "<p>Dúvidas? Responda este email ou use o suporte dentro do sistema.</p>",
    ].join("\n"),
  };
}
