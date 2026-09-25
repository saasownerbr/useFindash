"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SettingsCard } from "@/components/configuracoes/settings-card";
import { SubscriptionSection } from "@/components/configuracoes/subscription-section";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { applyTheme, currentTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function AccountCard() {
  const [email, setEmail] = useState<string | null>(null);
  const [light, setLight] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setLight(currentTheme() === "light");
    createClient()
      .auth.getSession()
      .then(({ data }) => setEmail(data.session?.user.email ?? null));
  }, []);

  async function signOut() {
    setSigningOut(true);
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  function toggleTheme() {
    const next = !light;
    setLight(next);
    applyTheme(next ? "light" : "dark");
  }

  return (
    <SettingsCard title="Minha Conta">
      <div>
        <p className="text-xs text-muted-foreground">Email</p>
        <p className="mt-1 truncate text-sm text-[#F0F0F0]">{email ?? "—"}</p>
      </div>

      <SubscriptionSection />

      <div className="mt-5 flex items-center justify-between border-t border-[#242424] pt-4">
        <div>
          <p className="text-sm font-medium text-foreground" id="light-mode-label">
            Modo claro
          </p>
          <p className="text-xs text-muted-foreground">Vale para este navegador.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={light}
          aria-labelledby="light-mode-label"
          onClick={toggleTheme}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors",
            light ? "bg-primary" : "bg-[#242424]"
          )}
        >
          <span
            className={cn(
              "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
              light && "translate-x-5"
            )}
          />
        </button>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#242424] pt-4">
        <div>
          <p className="text-sm font-medium text-foreground">Sair da conta</p>
          <p className="text-xs text-muted-foreground">Encerra a sessão neste navegador.</p>
        </div>
        <Button variant="danger" size="sm" onClick={signOut} disabled={signingOut}>
          <LogOut className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          {signingOut ? "Saindo..." : "Sair"}
        </Button>
      </div>
    </SettingsCard>
  );
}
