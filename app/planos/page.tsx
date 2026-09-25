"use client";

import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Toaster } from "@/components/ui/toaster";
import { useSubscriptionStatus } from "@/lib/hooks/use-subscription-status";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const BENEFITS = [
  "Gestão completa de estoque iPhone e Xiaomi",
  "Calculadora de seminovo com checkup",
  "CRM completo de clientes com alertas",
  "Dashboard financeiro com DRE",
  "Alertas de upgrade e aniversário",
  "Suporte via email",
];

type Plan = "monthly" | "annual";

export default function PlanosPage() {
  const router = useRouter();
  const status = useSubscriptionStatus();
  const [loading, setLoading] = useState<Plan | null>(null);
  const blocked = status?.access.access === "blocked";

  async function subscribe(plan: Plan) {
    setLoading(plan);
    try {
      const res = await fetch(`/api/subscription/${plan}`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.invoiceUrl) throw new Error(data?.error ?? "Não foi possível iniciar o pagamento");
      window.location.href = data.invoiceUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível iniciar o pagamento");
      setLoading(null);
    }
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 md:py-16">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-col items-center text-center">
          <Logo size="lg" />
          <h1 className="mt-8 text-[28px] font-bold text-foreground md:text-[32px]">Escolha seu plano</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">7 dias grátis para testar. Cancele quando quiser.</p>
          {blocked && (
            <p className="mt-4 rounded-lg border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] px-4 py-2 text-[13px] text-[#EF4444]">
              Seu período de acesso terminou. Escolha um plano para continuar usando o useFindash.
            </p>
          )}
        </header>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <PlanCard
            badge="Flexibilidade total"
            price="R$ 197"
            period="/mês"
            notes={["Renovação automática todo mês", "Cobrança no cartão de crédito"]}
            footnote="Sem fidelidade: cancele quando quiser"
            cta="Assinar mensalmente"
            loading={loading === "monthly"}
            disabled={loading !== null}
            onSubscribe={() => subscribe("monthly")}
          />
          <PlanCard
            featured
            badge="Melhor custo"
            price="R$ 1.891,20"
            period="/ano"
            discount="20% OFF"
            notes={["Equivale a R$ 157,60/mês"]}
            compareAt="De R$ 2.364,00"
            footnote="Parcele em até 12x no cartão"
            cta="Assinar anualmente"
            loading={loading === "annual"}
            disabled={loading !== null}
            onSubscribe={() => subscribe("annual")}
          />
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-[13px] text-muted-foreground">
          {!blocked && (
            <Link href="/dashboard" className="hover:text-foreground">
              Voltar ao sistema
            </Link>
          )}
          <button type="button" onClick={signOut} className="hover:text-foreground">
            Sair da conta
          </button>
        </div>
      </div>
      <Toaster />
    </div>
  );
}

function PlanCard({
  featured = false,
  badge,
  price,
  period,
  notes,
  discount,
  compareAt,
  footnote,
  cta,
  loading,
  disabled,
  onSubscribe,
}: {
  featured?: boolean;
  badge: string;
  price: string;
  period: string;
  notes?: string[];
  /** Small red pill beside the price. */
  discount?: string;
  /** Struck-through original price. */
  compareAt?: string;
  footnote?: string;
  cta: string;
  loading: boolean;
  disabled: boolean;
  onSubscribe: () => void;
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-2xl border bg-card p-6 shadow-card md:p-8",
        featured ? "border-[rgba(218,232,120,0.4)]" : "border-[#242424]"
      )}
    >
      <span
        className={cn(
          "self-start rounded-full px-3 py-1 text-xs font-semibold",
          featured ? "bg-[#dae878] text-[#111111]" : "bg-[#242424] text-[#9CA3AF]"
        )}
      >
        {badge}
      </span>

      <p className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="flex items-baseline gap-1">
          <span className="text-[40px] font-bold leading-none text-foreground sm:text-[48px]">{price}</span>
          <span className="text-[20px] text-[#9CA3AF]">{period}</span>
        </span>
        {discount && (
          <span className="self-center rounded-[999px] bg-[#EF4444] px-2 py-0.5 text-[11px] font-bold leading-4 text-[#FFFFFF]">
            {discount}
          </span>
        )}
      </p>
      <div className="mt-3 min-h-[66px] space-y-1 text-[13px] text-muted-foreground">
        {notes?.map((note) => <p key={note}>{note}</p>)}
        {compareAt && <p className="text-[#6B7280] line-through">{compareAt}</p>}
        {footnote && <p>{footnote}</p>}
      </div>

      <Button
        variant={featured ? "default" : "secondary"}
        className={cn("mt-6 w-full", featured && "bg-[#dae878] text-[#111111] hover:bg-[#cfdd6a]")}
        onClick={onSubscribe}
        disabled={disabled}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? "Redirecionando..." : cta}
      </Button>

      <ul className="mt-8 space-y-3 border-t border-[#242424] pt-6">
        {BENEFITS.map((benefit) => (
          <li key={benefit} className="flex items-start gap-3 text-sm text-foreground">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#dae878]" strokeWidth={2.5} />
            {benefit}
          </li>
        ))}
      </ul>
    </section>
  );
}
