import Link from "next/link";
import { AlertTriangle, ArrowUpCircle, Gift, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface AlertCardProps {
  count: number;
  label: string;
  icon: LucideIcon;
  /** Accent color and its 6% tint, used only while there is something to act on. */
  color: string;
  tint: string;
  href: string;
}

function AlertCard({ count, label, icon: Icon, color, tint, href }: AlertCardProps) {
  const active = count > 0;
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-4 rounded-xl border border-[#2A2A2A] border-l-[3px] p-5 transition-colors hover:border-[#3D3D3D]",
        !active && "bg-card"
      )}
      style={active ? { borderLeftColor: color, backgroundColor: tint } : { borderLeftColor: "#2A2A2A" }}
    >
      <Icon className="h-6 w-6 shrink-0" style={{ color: active ? color : "#6B7280" }} aria-hidden />
      <div>
        <p className="text-[32px] font-bold leading-none tabular-nums" style={{ color: active ? color : "#6B7280" }}>
          {count}
        </p>
        <p className="mt-1.5 text-xs text-[#9CA3AF]">{label}</p>
      </div>
    </Link>
  );
}

export function AlertsPanel({
  upgradeWindowCount,
  birthdaysCount,
  staleStockCount,
}: {
  upgradeWindowCount: number;
  birthdaysCount: number;
  staleStockCount: number;
}) {
  return (
    <section aria-label="Alertas" className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <AlertCard
        count={upgradeWindowCount}
        label="em janela de upgrade"
        icon={ArrowUpCircle}
        color="#F59E0B"
        tint="rgba(245,158,11,0.06)"
        href="/clientes?upgrade=in_window"
      />
      <AlertCard
        count={birthdaysCount}
        label="aniversários nos próximos 7 dias"
        icon={Gift}
        color="#10B981"
        tint="rgba(16,185,129,0.06)"
        href="/clientes"
      />
      <AlertCard
        count={staleStockCount}
        label="aparelhos parados no estoque"
        icon={AlertTriangle}
        color="#EF4444"
        tint="rgba(239,68,68,0.06)"
        href="/estoque"
      />
    </section>
  );
}
