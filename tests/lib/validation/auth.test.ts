import { describe, expect, it } from "vitest";

import { loginSchema } from "@/lib/validation/auth";

describe("loginSchema", () => {
  it("accepts a valid email", () => {
    expect(loginSchema.safeParse({ email: "dono@loja.com" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(loginSchema.safeParse({ email: "nao-e-email" }).success).toBe(false);
  });

  it("rejects an empty email", () => {
    expect(loginSchema.safeParse({ email: "" }).success).toBe(false);
  });
});
