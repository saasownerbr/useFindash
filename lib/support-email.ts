import { escapeHtml, renderEmail } from "@/lib/email-layout";
import { formatPhone } from "@/lib/phone";

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
    ["WhatsApp informado", escapeHtml(formatPhone(whatsapp))],
    ["Mensagem", escapeHtml(message).replace(/\n/g, "<br />")],
    ["Data e hora", `${timestamp} (horário de Brasília)`],
  ];

  return {
    subject: `[Suporte useFindash] ${storeName}`,
    html: renderEmail({
      preheader: `Mensagem de ${userEmail}`,
      title: "Nova mensagem de suporte recebida",
      bodyHtml: rows
        .map(
          ([label, value]) =>
            `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#D0D0D0;"><strong>${label}:</strong> ${value}</p>`
        )
        .join("\n"),
      footnoteHtml: "Responda este email para falar direto com o usuário (Reply-To).",
    }),
  };
}
