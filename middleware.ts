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
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
