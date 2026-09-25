import { Package, Percent, ShoppingCart } from "lucide-react";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { NetMarginCard, RevenueCard } from "@/components/finance-highlight-cards";
import type { DRE } from "@/lib/dre";
import { formatCurrencyBRL } from "@/lib/finance";
import { percentChange } from "@/lib/period";

function relative(current: number, previous: number | undefined) {
  if (previous === undefined) return null;
  const value = percentChange(current, previous);
  return value === null ? null : { value };
}

/** First dashboard row: five KPIs, each compared with the previous equivalent period. */
export function KpiCards({
  dre,
  previous,
  salesCount,
  previousSalesCount,
}: {
  dre: DRE;
  previous: DRE | null;
  salesCount: number;
  previousSalesCount: number | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-5">
      <RevenueCard label="Faturamento" value={dre.revenue} change={relative(dre.revenue, previous?.revenue)} />
      <KpiCard
        label="Vendas"
        value={salesCount.toLocaleString("pt-BR")}
        icon={ShoppingCart}
        change={relative(salesCount, previousSalesCount ?? undefined)}
        footer={salesCount === 1 ? "transação no período" : "transações no período"}
      />
      <KpiCard label="CMV" value={formatCurrencyBRL(dre.cmv)} icon={Package} change={relative(dre.cmv, previous?.cmv)} />
      <KpiCard
        label="Margem bruta"
        value={formatCurrencyBRL(dre.grossMargin)}
        icon={Percent}
        change={relative(dre.grossMargin, previous?.grossMargin)}
        footer={`${(dre.grossMarginPct * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% da receita`}
      />
      <NetMarginCard
        value={dre.netMargin}
        change={relative(dre.netMargin, previous?.netMargin)}
        // Five cards in a two-column grid: the last one takes the full row on phones.
        className="col-span-2 xl:col-span-1"
        footer={`Após ${formatCurrencyBRL(dre.costsByType.fixed)} de custos fixos proporcionais ao período`}
      />
    </div>
  );
}
