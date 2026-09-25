import { describe, it, expect } from "vitest";

import { customerSchema } from "@/lib/validation/customer";

describe("customerSchema", () => {
  it("requires a name and whatsapp", () => {
    expect(customerSchema.safeParse({ name: "", whatsapp: "", birthdate: "", acquisition_channel: "" }).success).toBe(
      false
    );
  });
  it("accepts a minimal valid customer", () => {
    expect(
      customerSchema.safeParse({
        name: "Maria Silva",
        whatsapp: "11999998888",
        birthdate: "",
        acquisition_channel: "instagram",
      }).success
    ).toBe(true);
  });
  it("rejects a birthdate in the future", () => {
    const future = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
    expect(
      customerSchema.safeParse({
        name: "Maria Silva",
        whatsapp: "11999998888",
        birthdate: future,
        acquisition_channel: "instagram",
      }).success
    ).toBe(false);
  });
  it("accepts the WhatsApp in any format and keeps only the digits", () => {
    const result = customerSchema.safeParse({
      name: "Maria Silva",
      whatsapp: "(11) 9 9999-8888",
      birthdate: "",
      acquisition_channel: "instagram",
    });
    expect(result.success && result.data.whatsapp).toBe("11999998888");
  });
});
