import Link from "next/link";
import { AlertTriangle, ArrowUpCircle, Gift, type LucideIcon } from "lucide-react";

interface AlertCardProps {
  count: number;
  label: string;
  icon: LucideIcon;
  /** Accent color and its 10% tint, used only while there is something to act on. */
  color: string;
  tint: string;
  href: string;
}

function AlertCard({ count, label, icon: Icon, color, tint, href }: AlertCardProps) {
  const active = count > 0;
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-card transition-colors hover:bg-[#1E1E1E] md:p-5"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: active ? tint : "#242424" }}
      >
        <Icon className="h-5 w-5" style={{ color: active ? color : "#808080" }} aria-hidden />
      </span>
      <div>
        <p className="text-[28px] font-bold leading-none tabular-nums" style={{ color: active ? color : "#808080" }}>
          {count}
        </p>
        <p className="mt-1.5 text-xs text-[#808080]">{label}</p>
      </div>
    </Link>
  );
}

/** Fourth dashboard row: alert counts; each opens the page that lists them (Clientes › Ações Urgentes, Estoque › Alertas). */
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
    <section aria-label="Alertas" className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
      <AlertCard
        count={upgradeWindowCount}
        label="em janela de upgrade"
        href="/clientes?filter=upgrade"
        icon={ArrowUpCircle}
        color="#F59E0B"
        tint="rgba(245,158,11,0.10)"
      />
      <AlertCard
        count={birthdaysCount}
        label="aniversários nos próximos 7 dias"
        href="/clientes?filter=birthday"
        icon={Gift}
        color="#10B981"
        tint="rgba(16,185,129,0.10)"
      />
      <AlertCard
        count={staleStockCount}
        label="aparelhos parados no estoque"
        href="/estoque?tab=alertas"
        icon={AlertTriangle}
        color="#EF4444"
        tint="rgba(239,68,68,0.10)"
      />
    </section>
  );
}
