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

describe("signupSchema", () => {
  const valid = { email: "dono@loja.com", password: "segredo", confirmPassword: "segredo" };

  it("accepts matching passwords with at least 6 characters", () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a password shorter than 6 characters", () => {
    const result = signupSchema.safeParse({ ...valid, password: "12345", confirmPassword: "12345" });
    expect(result.success).toBe(false);
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
