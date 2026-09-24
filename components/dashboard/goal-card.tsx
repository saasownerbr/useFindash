import Link from "next/link";
import { Target } from "lucide-react";

import { formatCurrencyBRL } from "@/lib/finance";
import { goalPace } from "@/lib/revenue-goal";

/** Month revenue against the goal set in Financeiro › Meta. */
export function GoalCard({ revenue, goal }: { revenue: number; goal: number }) {
  const pace = goalPace(revenue, goal);

  return (
    <div className="relative rounded-xl bg-card p-4 shadow-card md:p-5">
      <Target className="absolute right-4 top-4 h-4 w-4 text-[#808080] md:right-5 md:top-5" aria-hidden />
      <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#808080]">Meta do mês</p>
      {goal > 0 ? (
        <>
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <p className="text-[28px] font-bold leading-none tabular-nums text-[#F0F0F0]">
              {pace.percentage.toFixed(0)}%
            </p>
            <p className="text-right text-xs text-[#808080]">
              {formatCurrencyBRL(revenue)} de {formatCurrencyBRL(goal)}
            </p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#242424]">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pace.percentage}%` }} />
          </div>
          <p className="mt-3 text-xs text-[#808080]">
            {pace.remaining > 0
              ? `${formatCurrencyBRL(pace.dailyNeeded)}/dia nos ${pace.daysLeft} dias restantes`
              : "Meta batida neste mês"}
          </p>
        </>
      ) : (
        <Link href="/financeiro?tab=meta" className="mt-2 block text-sm text-primary hover:underline">
          Defina a meta de faturamento no Financeiro
        </Link>
      )}
    </div>
  );
}
