"use client";

import Link from "next/link";
import { useState } from "react";

import { openCurrentInvoice, useSubscriptionStatus } from "@/lib/hooks/use-subscription-status";

/** Strip above the page: trial countdown, or a red overdue warning. Nothing for paid, active stores. */
export function SubscriptionBanner() {
  const status = useSubscriptionStatus();
  const [paying, setPaying] = useState(false);
  if (!status) return null;
  const { access } = status;

  if (access.access === "full" && access.type === "trial") {
    const days = access.daysLeft === 1 ? "1 dia" : `${access.daysLeft} dias`;
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-[rgba(218,232,120,0.2)] bg-[rgba(218,232,120,0.08)] px-4 py-2 text-center text-[13px] text-foreground">
        <span>
          Seu trial termina em <strong>{days}</strong> — Escolha um plano para continuar
        </span>
        <Link href="/planos" className="font-semibold text-primary underline-offset-2 hover:underline">
          Ver planos
        </Link>
      </div>
    );
  }

  if (access.access === "warning" || access.access === "limited") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.12)] px-4 py-2 text-center text-[13px] text-[#EF4444]">
        <span>Pagamento pendente. Regularize para manter o acesso.</span>
        <button
          type="button"
          disabled={paying}
          onClick={() => {
            setPaying(true);
            void openCurrentInvoice();
          }}
          className="rounded-md bg-[#EF4444] px-3 py-1 text-xs font-semibold text-white hover:bg-[#dc2626] disabled:opacity-60"
        >
          {paying ? "Abrindo..." : "Pagar agora"}
        </button>
      </div>
    );
  }

  return null;
}
