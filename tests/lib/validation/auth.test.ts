import { describe, expect, it } from "vitest";

import { loginSchema, signupSchema } from "@/lib/validation/auth";

describe("loginSchema", () => {
  it("accepts a valid email and password", () => {
    expect(loginSchema.safeParse({ email: "dono@loja.com", password: "segredo" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(loginSchema.safeParse({ email: "nao-e-email", password: "segredo" }).success).toBe(false);
  });

  it("rejects empty fields", () => {
    expect(loginSchema.safeParse({ email: "", password: "segredo" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "dono@loja.com", password: "" }).success).toBe(false);
  });
});

describe("loginSchema length", () => {
  it("accepts any existing password, even short or long ones", () => {
    expect(loginSchema.safeParse({ email: "dono@loja.com", password: "123456" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "dono@loja.com", password: "x".repeat(200) }).success).toBe(true);
  });
});

describe("signupSchema", () => {
  const valid = { email: "dono@loja.com", password: "segredo1", confirmPassword: "segredo1" };

  it("accepts matching passwords with at least 8 characters", () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = signupSchema.safeParse({ ...valid, password: "1234567", confirmPassword: "1234567" });
    expect(result.success).toBe(false);
  });

  it("accepts long passwords up to Supabase's 72-character limit", () => {
    const long = "Aa1!".repeat(18);
    expect(signupSchema.safeParse({ ...valid, password: long, confirmPassword: long }).success).toBe(true);
    const tooLong = `${long}x`;
    expect(signupSchema.safeParse({ ...valid, password: tooLong, confirmPassword: tooLong }).success).toBe(false);
  });

  it("rejects passwords that do not match, flagging the confirmation field", () => {
    const result = signupSchema.safeParse({ ...valid, confirmPassword: "outra-senha" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["confirmPassword"]);
      expect(result.error.issues[0].message).toBe("As senhas não coincidem.");
    }
  });

  it("rejects an invalid email", () => {
    expect(signupSchema.safeParse({ ...valid, email: "nao-e-email" }).success).toBe(false);
  });
});
