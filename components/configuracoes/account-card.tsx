"use client";

import { useEffect, useState } from "react";

import { SettingsCard } from "@/components/configuracoes/settings-card";
import { createClient } from "@/lib/supabase/client";
import { applyTheme, currentTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function AccountCard() {
  const [email, setEmail] = useState<string | null>(null);
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(currentTheme() === "light");
    createClient()
      .auth.getSession()
      .then(({ data }) => setEmail(data.session?.user.email ?? null));
  }, []);

  function toggleTheme() {
    const next = !light;
    setLight(next);
    applyTheme(next ? "light" : "dark");
  }

  return (
    <SettingsCard title="Minha Conta">
      <dl className="grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">Email</dt>
          <dd className="mt-1 truncate text-sm text-[#F8F8F8]">{email ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Status da conta</dt>
          <dd className="mt-1">
            <span className="inline-flex rounded-md bg-[rgba(16,185,129,0.1)] px-2 py-0.5 text-xs font-medium text-[#10B981]">
              Ativo
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Data de renovação</dt>
          <dd className="mt-1 text-sm text-[#6B7280]">Não configurado</dd>
        </div>
      </dl>

      <div className="mt-5 flex items-center justify-between border-t border-[#2A2A2A] pt-4">
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
            light ? "bg-[#3B82F6]" : "bg-[#2A2A2A]"
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
    </SettingsCard>
  );
}
