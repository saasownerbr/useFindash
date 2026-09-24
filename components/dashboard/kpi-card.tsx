import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface KpiChange {
  /** Signed change: a fraction (0.12 = +12%) or, with `unit: "pp"`, percentage points. */
  value: number;
  unit?: "%" | "pp";
}

function ChangeBadge({ change }: { change: KpiChange }) {
  const up = change.value >= 0;
  const amount = change.unit === "pp" ? Math.abs(change.value) : Math.abs(change.value * 100);
  const Arrow = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
        up ? "bg-[rgba(16,185,129,0.10)] text-[#10B981]" : "bg-[rgba(239,68,68,0.10)] text-[#EF4444]"
      )}
      title="vs período anterior"
    >
      <Arrow className="h-3 w-3" aria-hidden />
      {amount.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
      {change.unit === "pp" ? " p.p." : "%"}
    </span>
  );
}

/** KPI card: uppercase label, big figure, change vs the previous period, icon in the corner. */
export function KpiCard({
  label,
  value,
  icon: Icon,
  change,
  valueClassName,
  className,
  footer,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  change?: KpiChange | null;
  valueClassName?: string;
  className?: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className={cn("relative rounded-xl bg-card p-4 shadow-card md:p-5", className)}>
      {Icon && <Icon className="absolute right-4 top-4 h-4 w-4 text-[#808080] md:right-5 md:top-5" aria-hidden />}
      <p className="pr-6 text-[11px] font-medium uppercase tracking-[0.06em] text-[#808080]">{label}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className={cn("text-[28px] font-bold leading-none tabular-nums text-[#F0F0F0] md:text-[32px]", valueClassName)}>
          {value}
        </p>
        {change && <ChangeBadge change={change} />}
      </div>
      {footer && <div className="mt-3 text-xs text-[#808080]">{footer}</div>}
    </div>
  );
}
