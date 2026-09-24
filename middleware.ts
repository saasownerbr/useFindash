import { NextResponse, type NextRequest } from "next/server";

import { resolveAuthRedirect } from "@/lib/auth/resolve-redirect";
import { updateSession } from "@/lib/supabase/middleware";

const HAS_STORE_COOKIE = "uf_has_store";

export async function middleware(request: NextRequest) {
  // Preview deployment URLs redirect to the fixed production URL.
  const host = request.headers.get("host") ?? "";
  const isPreviewer = host.includes("singlehub.vercel.app") && host !== "usefindash.vercel.app";

  if (isPreviewer) {
    const url = request.nextUrl.clone();
    url.host = "usefindash.vercel.app";
    url.port = "";
    return NextResponse.redirect(url, { status: 301 });
  }

  const { response, userId, supabase } = await updateSession(request);

  // Once a user has a store it stays that way, so remember it in a cookie
  // instead of querying store_users on every navigation. The cookie only
  // skips the onboarding redirect; data access is still enforced by RLS.
  let hasStore: boolean | null = null;
  let rememberStore = false;
  if (userId) {
    if (request.cookies.get(HAS_STORE_COOKIE)?.value === userId) {
      hasStore = true;
    } else {
      const { count } = await supabase
        .from("store_users")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      hasStore = (count ?? 0) > 0;
      rememberStore = hasStore;
    }
  }

  const redirectTo = resolveAuthRedirect(request.nextUrl.pathname, !!userId, hasStore);

  let result = response;
  if (redirectTo) {
    const url = request.nextUrl.clone();
    url.pathname = redirectTo;
    url.search = "";
    result = NextResponse.redirect(url);
    // Keep a refreshed session on the redirect too.
    response.cookies.getAll().forEach((cookie) => result.cookies.set(cookie));
  }

  if (rememberStore && userId) {
    result.cookies.set(HAS_STORE_COOKIE, userId, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return result;
}

export const config = {
  // Cron routes authenticate via the CRON_SECRET header, not a Supabase
  // session — Vercel's scheduler never has a logged-in user, so this
  // middleware must not redirect it to /login before the route handler's
  // own verifyCronSecret() check ever runs.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|site.webmanifest|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
