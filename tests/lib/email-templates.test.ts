import { describe, expect, it } from "vitest";

import { birthdayLabel, buildBirthdayAlertEmail, buildUpgradeAlertEmail } from "@/lib/alert-emails";
import { buildPasswordResetEmail, passwordResetUrl } from "@/lib/password-reset-email";

describe("password reset email", () => {
  it("is in Portuguese with the useFindash subject", () => {
    const { subject, html } = buildPasswordResetEmail({ resetUrl: "https://www.byfindash.com.br/auth/callback?x=1" });
    expect(subject).toBe("Redefinição de senha — useFindash");
    expect(html).toContain("Criar nova senha");
    expect(html).toContain('lang="pt-BR"');
    expect(html).not.toMatch(/reset your password/i);
  });

  it("links to the callback with the one-time token", () => {
    expect(passwordResetUrl("https://www.byfindash.com.br/", "abc123")).toBe(
      "https://www.byfindash.com.br/auth/callback?token_hash=abc123&type=recovery&next=%2Fredefinir-senha"
    );
  });
});

describe("cron alert emails", () => {
  it("escapes customer names", () => {
    const { html } = buildBirthdayAlertEmail("Loja", [{ name: "<b>Ana</b>", whatsapp: "11999998888", birthdate: "1990-10-01" }]);
    expect(html).toContain("&lt;b&gt;Ana&lt;/b&gt;");
    expect(html).not.toContain("<b>Ana</b>");
  });

  it("shows the birthday as dd/mm without a timezone shift", () => {
    expect(birthdayLabel("1990-10-01")).toBe("01/10");
  });

  it("lists upgrade customers with model and phone", () => {
    const { subject, html } = buildUpgradeAlertEmail("iStore", [
      { name: "Bia", whatsapp: "11999998888", model: "iPhone 13", soldAt: "2024-12-10T15:00:00Z" },
    ]);
    expect(subject).toBe("Clientes em janela de upgrade — iStore");
    expect(html).toContain("iPhone 13");
    expect(html).toContain("(11) 9 9999-8888");
  });
});
