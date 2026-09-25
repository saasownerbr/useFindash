import { describe, expect, it } from "vitest";

import { resolveAuthRedirect } from "@/lib/auth/resolve-redirect";

describe("resolveAuthRedirect", () => {
  it("sends unauthenticated users on protected routes to /login", () => {
    expect(resolveAuthRedirect("/dashboard", false, null)).toBe("/login");
  });

  it("lets unauthenticated users reach /login", () => {
    expect(resolveAuthRedirect("/login", false, null)).toBeNull();
  });

  it("lets signed-out users ask for a password reset", () => {
    expect(resolveAuthRedirect("/recuperar-senha", false, null)).toBeNull();
  });

  it("lets the reset link open signed out or signed in, with or without a store", () => {
    expect(resolveAuthRedirect("/redefinir-senha", false, null)).toBeNull();
    expect(resolveAuthRedirect("/redefinir-senha", true, true)).toBeNull();
    expect(resolveAuthRedirect("/redefinir-senha", true, false)).toBeNull();
  });

  it("lets the email link callback run signed out or signed in", () => {
    expect(resolveAuthRedirect("/auth/callback", false, null)).toBeNull();
    expect(resolveAuthRedirect("/auth/callback", true, true)).toBeNull();
  });

  it("lets unauthenticated users reach /signup", () => {
    expect(resolveAuthRedirect("/signup", false, null)).toBeNull();
  });

  it("sends authenticated users with a store away from /signup to /dashboard", () => {
    expect(resolveAuthRedirect("/signup", true, true)).toBe("/dashboard");
  });

  it("sends authenticated users without a store from /dashboard to /onboarding", () => {
    expect(resolveAuthRedirect("/dashboard", true, false)).toBe("/onboarding");
  });

  it("sends authenticated users with a store away from /login to /dashboard", () => {
    expect(resolveAuthRedirect("/login", true, true)).toBe("/dashboard");
  });

  it("lets authenticated users with a store stay on /dashboard", () => {
    expect(resolveAuthRedirect("/dashboard", true, true)).toBeNull();
  });

  it("keeps authenticated users with a store off /onboarding", () => {
    expect(resolveAuthRedirect("/onboarding", true, true)).toBe("/dashboard");
  });

  it("lets authenticated users without a store stay on /onboarding", () => {
    expect(resolveAuthRedirect("/onboarding", true, false)).toBeNull();
  });
});
