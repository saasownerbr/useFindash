import { emailList, emailParagraph, escapeHtml, renderEmail } from "@/lib/email-layout";
import { formatPhone } from "@/lib/phone";

const APP_URL = () => (process.env.NEXT_PUBLIC_APP_URL || "https://www.byfindash.com.br").replace(/\/$/, "");

/** dd/mm of a yyyy-mm-dd birthdate, read as a calendar date (no timezone shift). */
export function birthdayLabel(birthdate: string) {
  const [, month, day] = birthdate.slice(0, 10).split("-");
  return `${day}/${month}`;
}

export function buildUpgradeAlertEmail(
  storeName: string,
  customers: { name: string; whatsapp: string; model: string | null; soldAt: string }[]
) {
  return {
    subject: `Clientes em janela de upgrade — ${storeName}`,
    html: renderEmail({
      preheader: `${customers.length} ${customers.length === 1 ? "cliente pronto" : "clientes prontos"} para trocar de aparelho.`,
      title: "Clientes em janela de upgrade",
      bodyHtml:
        emailParagraph(`Estes clientes da <strong style="color:#F0F0F0;">${escapeHtml(storeName)}</strong> compraram o último aparelho há tempo suficiente para um upgrade:`) +
        emailList(
          customers.map(
            (c) =>
              `<strong style="color:#F0F0F0;">${escapeHtml(c.name)}</strong> — ${escapeHtml(c.model ?? "aparelho")} — comprado em ${new Date(
                c.soldAt
              ).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })} — ${escapeHtml(formatPhone(c.whatsapp))}`
          )
        ),
      cta: { label: "Ver clientes", url: `${APP_URL()}/clientes?filter=upgrade` },
    }),
  };
}

export function buildBirthdayAlertEmail(
  storeName: string,
  customers: { name: string; whatsapp: string; birthdate: string }[]
) {
  return {
    subject: `Aniversariantes dos próximos 7 dias — ${storeName}`,
    html: renderEmail({
      preheader: `${customers.length} ${customers.length === 1 ? "cliente faz" : "clientes fazem"} aniversário nos próximos 7 dias.`,
      title: "Aniversariantes dos próximos 7 dias",
      bodyHtml:
        emailParagraph(`Uma mensagem no dia certo aproxima o cliente da <strong style="color:#F0F0F0;">${escapeHtml(storeName)}</strong>:`) +
        emailList(
          customers.map(
            (c) =>
              `<strong style="color:#F0F0F0;">${escapeHtml(c.name)}</strong> — aniversário em ${birthdayLabel(c.birthdate)} — ${escapeHtml(
                formatPhone(c.whatsapp)
              )}`
          )
        ),
      cta: { label: "Ver clientes", url: `${APP_URL()}/clientes?filter=birthday` },
    }),
  };
}
