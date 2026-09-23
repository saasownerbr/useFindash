import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // Set an HttpOnly cookie to communicate the error state instead of URL params
      const response = NextResponse.redirect(`${origin}/login`);
      response.cookies.set("auth_error", "expired_link", { maxAge: 10 });
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
