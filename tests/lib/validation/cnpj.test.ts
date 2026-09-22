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
