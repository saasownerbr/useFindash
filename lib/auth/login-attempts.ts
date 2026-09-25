/**
 * Wrong-password lockout for the login form, kept in sessionStorage (never in the database): after
 * MAX_LOGIN_ATTEMPTS consecutive failures the form is replaced by a redirect to password recovery. A successful
 * login, a password reset or LOCKOUT_MS without failures clears the count.
 */
export const MAX_LOGIN_ATTEMPTS = 3;
export const LOCKOUT_MS = 15 * 60 * 1000;

const STORAGE_KEY = "login_attempts";

export interface LoginAttempts {
  count: number;
  /** Time of the latest failure, in ms. */
  lastFailureAt: number;
}

/** The stored attempts, or zero when there are none or the last failure is older than LOCKOUT_MS. */
export function currentAttempts(stored: LoginAttempts | null, now: number): LoginAttempts {
  if (!stored || now - stored.lastFailureAt >= LOCKOUT_MS) return { count: 0, lastFailureAt: 0 };
  return stored;
}

export function recordFailure(stored: LoginAttempts | null, now: number): LoginAttempts {
  return { count: currentAttempts(stored, now).count + 1, lastFailureAt: now };
}

export function remainingAttempts(attempts: LoginAttempts): number {
  return Math.max(0, MAX_LOGIN_ATTEMPTS - attempts.count);
}

export function isLockedOut(attempts: LoginAttempts): boolean {
  return attempts.count >= MAX_LOGIN_ATTEMPTS;
}

export function wrongPasswordMessage(remaining: number): string {
  return `Email ou senha incorretos. ${remaining} ${remaining === 1 ? "tentativa restante" : "tentativas restantes"}.`;
}

export function readAttempts(): LoginAttempts | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LoginAttempts) : null;
  } catch {
    return null;
  }
}

export function saveAttempts(attempts: LoginAttempts) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
  } catch {
    // Blocked storage: the count still holds for this page.
  }
}

export function clearAttempts() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing stored to clear.
  }
}
