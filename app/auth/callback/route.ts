import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Supabase email links (password recovery) land here with a PKCE ?code=. It is exchanged for a session on the
 * server, where the code verifier cookie set by resetPasswordForEmail is readable, then the user moves on to `next`
 * (default: set a new password). An expired or reused link still lands on /redefinir-senha, which explains it.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  // Only same-site paths, never "//evil.com".
  const next = nextParam?.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/redefinir-senha";

  if (code) {
    await createClient().auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, origin));
}
