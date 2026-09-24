import { Package, Percent } from "lucide-react";

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

/** First dashboard row: four KPIs, each compared with the previous period of the same length. */
export function KpiCards({ dre, previous }: { dre: DRE; previous: DRE | null }) {
  const marginPoints = previous ? (dre.grossMarginPct - previous.grossMarginPct) * 100 : null;

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
      <RevenueCard label="Faturamento" value={dre.revenue} change={relative(dre.revenue, previous?.revenue)} />
      <KpiCard label="CMV" value={formatCurrencyBRL(dre.cmv)} icon={Package} change={relative(dre.cmv, previous?.cmv)} />
      <KpiCard
        label="Margem bruta"
        value={`${(dre.grossMarginPct * 100).toFixed(1)}%`}
        icon={Percent}
        change={marginPoints === null || (previous?.revenue ?? 0) === 0 ? null : { value: marginPoints, unit: "pp" }}
      />
      <NetMarginCard value={dre.netMargin} change={relative(dre.netMargin, previous?.netMargin)} />
    </div>
  );
}
