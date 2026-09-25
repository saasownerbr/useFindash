"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { openCurrentInvoice, useSubscriptionStatus } from "@/lib/hooks/use-subscription-status";

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—";
}

/** "Minha Assinatura" inside Minha Conta: trial, plan, overdue or cancelled, each with its next step. */
export function SubscriptionSection() {
  const status = useSubscriptionStatus();
  const [opening, setOpening] = useState(false);

  function manage() {
    setOpening(true);
    void openCurrentInvoice();
  }

  let body: ReactNode;
  if (!status) {
    body = <p className="text-sm text-muted-foreground">Carregando...</p>;
  } else if (status.access.access === "warning" || status.access.access === "limited") {
    body = (
      <Row
        title={<span className="text-[#EF4444]">Pagamento pendente</span>}
        detail="Regularize o pagamento para manter o acesso ao sistema."
        action={
          <Button asChild size="sm" variant="danger">
            <Link href="/planos">Regularizar</Link>
          </Button>
        }
      />
    );
  } else if (status.access.access === "full" && status.access.type === "trial") {
    const days = status.access.daysLeft === 1 ? "1 dia restante" : `${status.access.daysLeft} dias restantes`;
    body = (
      <Row
        title={`Trial gratuito — ${days}`}
        detail={`Termina em ${formatDate(status.trial_end)}`}
        action={
          <Button asChild size="sm">
            <Link href="/planos">Escolher plano</Link>
          </Button>
        }
      />
    );
  } else if (status.access.access === "full") {
    const annual = status.plan?.interval === "annual";
    body = (
      <Row
        title={`Plano ${status.plan?.name ?? ""}`.trim()}
        detail={
          annual
            ? `Acesso válido até ${formatDate(status.current_period_end)}`
            : `Próxima renovação em ${formatDate(status.current_period_end)}`
        }
        action={
          <Button size="sm" variant="secondary" onClick={manage} disabled={opening}>
            {opening ? "Abrindo..." : "Gerenciar pagamento"}
          </Button>
        }
      />
    );
  } else {
    body = (
      <Row
        title={status.status === "cancelled" ? "Plano cancelado" : "Acesso expirado"}
        detail="Escolha um plano para voltar a usar o sistema."
        action={
          <Button asChild size="sm">
            <Link href="/planos">Reativar</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="mt-5 border-t border-[#242424] pt-4">
      <p className="mb-3 text-xs text-muted-foreground">Minha Assinatura</p>
      {body}
    </div>
  );
}

function Row({ title, detail, action }: { title: ReactNode; detail: string; action: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
      </div>
      {action}
    </div>
  );
}
