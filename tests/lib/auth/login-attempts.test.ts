import { describe, expect, it } from "vitest";

import {
  LOCKOUT_MS,
  currentAttempts,
  isLockedOut,
  recordFailure,
  remainingAttempts,
  wrongPasswordMessage,
} from "@/lib/auth/login-attempts";

describe("login attempts", () => {
  it("counts consecutive failures and locks out on the third", () => {
    const first = recordFailure(null, 1000);
    expect(remainingAttempts(first)).toBe(2);
    const second = recordFailure(first, 2000);
    expect(remainingAttempts(second)).toBe(1);
    expect(isLockedOut(second)).toBe(false);
    expect(isLockedOut(recordFailure(second, 3000))).toBe(true);
  });

  it("starts over 15 minutes after the last failure", () => {
    const locked = { count: 3, lastFailureAt: 0 };
    expect(currentAttempts(locked, LOCKOUT_MS - 1).count).toBe(3);
    expect(currentAttempts(locked, LOCKOUT_MS).count).toBe(0);
    expect(recordFailure(locked, LOCKOUT_MS).count).toBe(1);
  });

  it("tells how many attempts are left", () => {
    expect(wrongPasswordMessage(2)).toBe("Email ou senha incorretos. 2 tentativas restantes.");
    expect(wrongPasswordMessage(1)).toBe("Email ou senha incorretos. 1 tentativa restante.");
  });
});
