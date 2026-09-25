import { describe, expect, it } from "vitest";

import { supportSchema } from "@/lib/validation/support";

describe("supportSchema", () => {
  const valid = { description: "O estoque não carrega desde ontem.", whatsapp: "(11) 99999-8888" };

  it("accepts a masked WhatsApp and returns only digits", () => {
    const result = supportSchema.safeParse(valid);
    expect(result.success && result.data.whatsapp).toBe("11999998888");
  });

  it("rejects a WhatsApp without DDD", () => {
    expect(supportSchema.safeParse({ ...valid, whatsapp: "99999-8888" }).success).toBe(false);
  });

  it("rejects messages over 500 characters", () => {
    expect(supportSchema.safeParse({ ...valid, description: "a".repeat(501) }).success).toBe(false);
  });

  it("rejects very short messages", () => {
    expect(supportSchema.safeParse({ ...valid, description: "erro" }).success).toBe(false);
  });
});
