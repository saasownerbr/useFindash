import { describe, expect, it } from "vitest";

import { buildSupportEmail } from "@/lib/support-email";

const input = {
  storeName: "iPlace Centro",
  userEmail: "dono@loja.com",
  whatsapp: "11999998888",
  message: "O estoque não carrega.\nJá tentei sair e entrar.",
  sentAt: new Date("2026-09-24T15:30:00Z"),
};

describe("buildSupportEmail", () => {
  it("puts the store name in the subject", () => {
    expect(buildSupportEmail(input).subject).toBe("[Suporte useFindash] iPlace Centro");
  });

  it("lists every field in the body", () => {
    const { html } = buildSupportEmail(input);
    expect(html).toContain("Nova mensagem de suporte recebida");
    expect(html).toContain("<strong>Nome da loja:</strong> iPlace Centro");
    expect(html).toContain("<strong>Email do usuário:</strong> dono@loja.com");
    expect(html).toContain("<strong>WhatsApp informado:</strong> (11) 9 9999-8888");
    expect(html).toContain("O estoque não carrega.<br />Já tentei sair e entrar.");
    expect(html).toContain("<strong>Data e hora:</strong> 24/09/2026, 12:30 (horário de Brasília)");
  });

  it("escapes HTML typed by the user", () => {
    const { html } = buildSupportEmail({ ...input, message: '<img src=x onerror="alert(1)">' });
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });
});
