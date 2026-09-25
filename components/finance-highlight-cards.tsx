import { DollarSign, Wallet } from "lucide-react";

import { KpiCard, type KpiChange } from "@/components/dashboard/kpi-card";
import { formatCurrencyBRL } from "@/lib/finance";
import { cn } from "@/lib/utils";

/** Revenue KPI (dashboard and DRE). */
export function RevenueCard({ label, value, change }: { label: string; value: number; change?: KpiChange | null }) {
  return <KpiCard label={label} value={formatCurrencyBRL(value)} icon={DollarSign} change={change} />;
}

/** Net margin (dashboard and DRE): the whole card turns green when positive and red when negative. */
export function NetMarginCard({
  value,
  change,
  footer,
  className,
}: {
  value: number;
  change?: KpiChange | null;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <KpiCard
      label="Margem líquida"
      value={formatCurrencyBRL(value)}
      icon={Wallet}
      change={change}
      footer={footer}
      className={cn(
        value > 0 && "border border-[rgba(16,185,129,0.35)] bg-[rgba(16,185,129,0.06)]",
        value < 0 && "border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.06)]",
        className
      )}
      valueClassName={value > 0 ? "text-[#10B981]" : value < 0 ? "text-[#EF4444]" : undefined}
    />
  );
}
