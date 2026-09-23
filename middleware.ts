import { NextResponse, type NextRequest } from "next/server";

import { resolveAuthRedirect } from "@/lib/auth/resolve-redirect";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request);

  let hasStore: boolean | null = null;
  if (user) {
    const { count } = await supabase
      .from("store_users")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    hasStore = (count ?? 0) > 0;
  }

  const redirectTo = resolveAuthRedirect(request.nextUrl.pathname, !!user, hasStore);

  if (redirectTo) {
    const url = request.nextUrl.clone();
    url.pathname = redirectTo;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Cron routes authenticate via the CRON_SECRET header, not a Supabase
  // session — Vercel's scheduler never has a logged-in user, so this
  // middleware must not redirect it to /login before the route handler's
  // own verifyCronSecret() check ever runs.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|site.webmanifest|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
