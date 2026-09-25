import { beforeEach, describe, expect, it } from "vitest";

import { createAccessCookie, hasCachedAccess } from "@/lib/access-cookie";

describe("access cookie", () => {
  beforeEach(() => {
    process.env.ACCESS_COOKIE_SECRET = "test-secret";
  });

  it("accepts its own cookie for the same user until it expires", async () => {
    const cookie = await createAccessCookie("user-1", 2_000);
    expect(await hasCachedAccess(cookie, "user-1", 1_000)).toBe(true);
    expect(await hasCachedAccess(cookie, "user-1", 2_000)).toBe(false);
    expect(await hasCachedAccess(cookie, "user-2", 1_000)).toBe(false);
  });

  it("rejects a cookie whose expiry was edited", async () => {
    const cookie = await createAccessCookie("user-1", 2_000);
    const forged = cookie.replace(".2000.", ".9999999999999.");
    expect(await hasCachedAccess(forged, "user-1", 1_000)).toBe(false);
  });
});
