import { describe, expect, it } from "vitest";

import { resolveAuthRedirect } from "@/lib/auth/resolve-redirect";

describe("resolveAuthRedirect", () => {
  it("sends unauthenticated users on protected routes to /login", () => {
    expect(resolveAuthRedirect("/dashboard", false, null)).toBe("/login");
  });

  it("lets unauthenticated users reach /login", () => {
    expect(resolveAuthRedirect("/login", false, null)).toBeNull();
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
