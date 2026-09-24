import { describe, expect, it } from "vitest";

import { formatWhatsapp, supportSchema } from "@/lib/validation/support";

describe("formatWhatsapp", () => {
  it("masks a mobile number as it is typed", () => {
    expect(formatWhatsapp("1")).toBe("(1");
    expect(formatWhatsapp("11")).toBe("(11");
    expect(formatWhatsapp("119")).toBe("(11) 9");
    expect(formatWhatsapp("1199999")).toBe("(11) 9999-9");
    expect(formatWhatsapp("11999998888")).toBe("(11) 99999-8888");
  });

  it("formats a 10-digit landline", () => {
    expect(formatWhatsapp("1133334444")).toBe("(11) 3333-4444");
  });

  it("ignores non-digits and extra digits", () => {
    expect(formatWhatsapp("(11) 99999-8888 ramal 2")).toBe("(11) 99999-8888");
  });
});

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
