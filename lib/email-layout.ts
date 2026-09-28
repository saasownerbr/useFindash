/**
 * Shared HTML shell for every email useFindash sends (welcome, password reset, cron alerts, support): the app's
 * dark card, lime accent and "use." wordmark. Tables and inline styles only, which is what email clients render.
 */

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const LIME = "#dae878";

export interface EmailLayoutInput {
  /** Hidden preview line shown by inbox lists next to the subject. */
  preheader: string;
  title: string;
  /** Trusted HTML: callers escape any user data before passing it. */
  bodyHtml: string;
  cta?: { label: string; url: string };
  /** Small print under the button (trusted HTML). */
  footnoteHtml?: string;
}

export function emailParagraph(html: string) {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#D0D0D0;">${html}</p>`;
}

export function emailList(items: string[]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border-collapse:collapse;">${items
    .map(
      (item) =>
        `<tr><td style="padding:10px 12px;border-bottom:1px solid #242424;font-size:14px;line-height:1.5;color:#D0D0D0;">${item}</td></tr>`
    )
    .join("")}</table>`;
}

export function renderEmail({ preheader, title, bodyHtml, cta, footnoteHtml }: EmailLayoutInput): string {
  const button = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;"><tr><td style="border-radius:10px;background:${LIME};"><a href="${escapeHtml(
        cta.url
      )}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#111111;text-decoration:none;border-radius:10px;">${escapeHtml(
        cta.label
      )}</a></td></tr></table>`
    : "";
  const footnote = footnoteHtml
    ? `<p style="margin:0;font-size:12px;line-height:1.6;color:#808080;">${footnoteHtml}</p>`
    : "";

  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#0F0F0F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0F0F0F;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="padding:0 4px 20px;font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#F0F0F0;">use<span style="color:${LIME};">.</span></td></tr>
<tr><td style="background:#1A1A1A;border:1px solid #242424;border-radius:16px;padding:32px 28px;">
<h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;font-weight:700;color:#F0F0F0;">${escapeHtml(title)}</h1>
${bodyHtml}
${button}
${footnote}
</td></tr>
<tr><td style="padding:20px 4px 0;font-size:12px;line-height:1.6;color:#606060;">useFindash · Gestão inteligente para lojistas de iPhone<br>Este é um email automático, enviado por noreply@byfindash.com.br.</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
