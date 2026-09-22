import { describe, expect, it } from "vitest";

import { loginSchema, signupSchema } from "@/lib/validation/auth";

describe("loginSchema", () => {
  it("accepts a valid email and password", () => {
    expect(loginSchema.safeParse({ email: "dono@loja.com", password: "segredo123" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(loginSchema.safeParse({ email: "nao-e-email", password: "segredo123" }).success).toBe(false);
  });

  it("rejects an empty email", () => {
    expect(loginSchema.safeParse({ email: "", password: "segredo123" }).success).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "dono@loja.com", password: "" }).success).toBe(false);
  });
});

describe("signupSchema", () => {
  const valid = {
    storeName: "iStore Centro",
    cnpj: "12.345.678/0001-95",
    email: "dono@loja.com",
    password: "segredo123",
  };

  it("accepts valid signup data and normalizes the CNPJ", () => {
    const result = signupSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cnpj).toBe("12345678000195");
    }
  });

  it("rejects a store name shorter than 2 characters", () => {
    expect(signupSchema.safeParse({ ...valid, storeName: "a" }).success).toBe(false);
  });

  it("rejects a CNPJ with fewer than 14 digits", () => {
    expect(signupSchema.safeParse({ ...valid, cnpj: "123.456.789" }).success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(signupSchema.safeParse({ ...valid, password: "1234567" }).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(signupSchema.safeParse({ ...valid, email: "nao-e-email" }).success).toBe(false);
  });
});
