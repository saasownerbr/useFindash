import { describe, expect, it } from "vitest";

import { isValidCnpjFormat, normalizeCnpj } from "@/lib/validation/cnpj";

describe("normalizeCnpj", () => {
  it("strips mask characters", () => {
    expect(normalizeCnpj("12.345.678/0001-95")).toBe("12345678000195");
  });
});

describe("isValidCnpjFormat", () => {
  it("accepts 14 digits with mask", () => {
    expect(isValidCnpjFormat("12.345.678/0001-95")).toBe(true);
  });

  it("accepts 14 raw digits", () => {
    expect(isValidCnpjFormat("12345678000195")).toBe(true);
  });

  it("rejects fewer than 14 digits", () => {
    expect(isValidCnpjFormat("1234567800019")).toBe(false);
  });

  it("rejects more than 14 digits", () => {
    expect(isValidCnpjFormat("123456780001955")).toBe(false);
  });
});

describe("isValidCpfCnpj", () => {
  it("checks CPF and CNPJ check digits", async () => {
    const { isValidCpfCnpj, formatCpfCnpj } = await import("@/lib/validation/cnpj");
    expect(isValidCpfCnpj("529.982.247-25")).toBe(true);
    expect(isValidCpfCnpj("11.222.333/0001-81")).toBe(true);
    expect(isValidCpfCnpj("111.111.111-11")).toBe(false);
    expect(isValidCpfCnpj("11.222.333/0001-82")).toBe(false);
    expect(formatCpfCnpj("52998224725")).toBe("529.982.247-25");
    expect(formatCpfCnpj("11222333000181")).toBe("11.222.333/0001-81");
  });
});
