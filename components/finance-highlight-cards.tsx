import { DollarSign, Wallet } from "lucide-react";

import { KpiCard, type KpiChange } from "@/components/dashboard/kpi-card";
import { formatCurrencyBRL } from "@/lib/finance";

/** Revenue KPI (dashboard and DRE). */
export function RevenueCard({ label, value, change }: { label: string; value: number; change?: KpiChange | null }) {
  return <KpiCard label={label} value={formatCurrencyBRL(value)} icon={DollarSign} change={change} />;
}

/** Net margin: the figure turns green when positive and red when negative. */
export function NetMarginCard({ value, change }: { value: number; change?: KpiChange | null }) {
  return (
    <KpiCard
      label="Margem líquida"
      value={formatCurrencyBRL(value)}
      icon={Wallet}
      change={change}
      valueClassName={value > 0 ? "text-[#10B981]" : value < 0 ? "text-[#EF4444]" : undefined}
    />
  );
}
