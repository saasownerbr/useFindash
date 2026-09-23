"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createClient();

        // Get the session which automatically resolves the token from hash
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          router.replace("/login?error=auth_failed");
          return;
        }

        // Redirect to dashboard without hash in URL
        router.replace("/dashboard");
      } catch (err) {
        router.replace("/login?error=auth_failed");
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Autenticando...</p>
      </div>
    </div>
  );
}
