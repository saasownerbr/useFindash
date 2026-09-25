// A signed "this user had full access until T" cookie, so the middleware does not query the subscription on every
// navigation. Only full access is cached, and never past the moment it ends; a tampered cookie fails the signature.

export const ACCESS_COOKIE = "uf_access";
/** Longest a cached "full access" is trusted before asking the database again (a payment may have changed it). */
export const ACCESS_CACHE_MS = 10 * 60 * 1000;

function secret(): string {
  return process.env.ACCESS_COOKIE_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(mac), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createAccessCookie(userId: string, validUntil: number): Promise<string> {
  const payload = `${userId}.${validUntil}`;
  return `${payload}.${await sign(payload)}`;
}

export async function hasCachedAccess(value: string | undefined, userId: string, now = Date.now()): Promise<boolean> {
  if (!value || !secret()) return false;
  const [id, until, mac] = value.split(".");
  if (id !== userId || !until || !mac || Number(until) <= now) return false;
  return (await sign(`${id}.${until}`)) === mac;
}
