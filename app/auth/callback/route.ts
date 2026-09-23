import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const target = new URL("/dashboard", request.nextUrl.origin);

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const response = NextResponse.redirect(new URL("/login", request.nextUrl.origin));
      response.cookies.set("auth_error", "expired_link", { maxAge: 10 });
      return response;
    }
  }

  return NextResponse.redirect(target);
}
