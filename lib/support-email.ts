import { formatWhatsapp } from "@/lib/validation/support";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface SupportEmailInput {
  storeName: string;
  userEmail: string;
  whatsapp: string;
  message: string;
  sentAt: Date;
}

/** Subject and HTML body of the message the support team receives. */
export function buildSupportEmail({ storeName, userEmail, whatsapp, message, sentAt }: SupportEmailInput) {
  const timestamp = sentAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
  const rows: [string, string][] = [
    ["Nome da loja", escapeHtml(storeName)],
    ["Email do usuário", escapeHtml(userEmail)],
    ["WhatsApp informado", escapeHtml(formatWhatsapp(whatsapp))],
    ["Mensagem", escapeHtml(message).replace(/\n/g, "<br />")],
    ["Data e hora", `${timestamp} (horário de Brasília)`],
  ];

  return {
    subject: `[Suporte useFindash] ${storeName}`,
    html: [
      "<h2>Nova mensagem de suporte recebida</h2>",
      ...rows.map(([label, value]) => `<p><strong>${label}:</strong> ${value}</p>`),
    ].join("\n"),
  };
}
