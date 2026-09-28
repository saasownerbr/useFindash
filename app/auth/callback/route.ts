import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Email links land here. The password reset email sent by /api/auth/recover carries ?token_hash=&type=recovery,
 * verified on the server into a session; older Supabase links carry a PKCE ?code=. Either way the user moves on to
 * `next` (default: set a new password). An expired or reused link still lands on /redefinir-senha, which explains it.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next");
  // Only same-site paths, never "//evil.com".
  const next = nextParam?.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/redefinir-senha";

  const supabase = createClient();
  if (tokenHash && type) {
    await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  } else if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, origin));
}
