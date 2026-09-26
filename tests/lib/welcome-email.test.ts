import { afterEach, describe, expect, it, vi } from "vitest";

import { buildWelcomeEmail, DEFAULT_EMAIL_FROM, emailFrom } from "@/lib/welcome-email";

describe("buildWelcomeEmail", () => {
  const input = { ownerName: "Ana Souza", storeName: "iStore <Centro>", appUrl: "https://www.byfindash.com.br/" };

  it("uses the welcome subject", () => {
    expect(buildWelcomeEmail(input).subject).toBe("Bem-vindo ao useFindash");
  });

  it("greets by first name, escapes the store name and links the dashboard", () => {
    const { html } = buildWelcomeEmail(input);
    expect(html).toContain("Olá, Ana!");
    expect(html).toContain("iStore &lt;Centro&gt;");
    expect(html).toContain('href="https://www.byfindash.com.br/dashboard"');
  });
});

describe("emailFrom", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("defaults to the byfindash.com.br sender", () => {
    vi.stubEnv("RESEND_FROM_EMAIL", "");
    expect(emailFrom()).toBe(DEFAULT_EMAIL_FROM);
    expect(DEFAULT_EMAIL_FROM).toContain("@byfindash.com.br");
  });

  it("honours RESEND_FROM_EMAIL", () => {
    vi.stubEnv("RESEND_FROM_EMAIL", "useFindash <oi@byfindash.com.br>");
    expect(emailFrom()).toBe("useFindash <oi@byfindash.com.br>");
  });
});
