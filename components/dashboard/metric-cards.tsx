import Link from "next/link";
import { Megaphone, Receipt, Repeat } from "lucide-react";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { formatCurrencyBRL } from "@/lib/finance";

export interface PaidTrafficMetrics {
  cac: number;
  salesCount: number;
  investment: number;
}

/** Third dashboard row: CAC, average ticket and retention, each with a line of context. */
export function MetricCards({
  avgTicket,
  salesCount,
  serviceCount = 0,
  paidTraffic,
  retentionRate,
  buyersCount,
}: {
  avgTicket: number;
  salesCount: number;
  /** Finished technical-assistance services in the period; their revenue is part of the ticket. */
  serviceCount?: number;
  paidTraffic: PaidTrafficMetrics;
  retentionRate: number;
  buyersCount: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
      <KpiCard
        label="CAC Tráfego Pago"
        icon={Megaphone}
        value={
          paidTraffic.investment <= 0
            ? "Sem dados"
            : paidTraffic.salesCount > 0
              ? formatCurrencyBRL(paidTraffic.cac)
              : "Sem vendas"
        }
        footer={
          paidTraffic.investment > 0 ? (
            `${paidTraffic.salesCount} ${paidTraffic.salesCount === 1 ? "venda" : "vendas"} de tráfego pago · ${formatCurrencyBRL(paidTraffic.investment)} investidos no mês`
          ) : (
            <Link href="/financeiro?tab=trafego" className="text-primary hover:underline">
              Configure o investimento no módulo Financeiro
            </Link>
          )
        }
      />
      <KpiCard
        label="Ticket médio"
        icon={Receipt}
        value={salesCount + serviceCount > 0 ? formatCurrencyBRL(avgTicket) : "Sem dados"}
        footer={
          serviceCount > 0
            ? `Receita do período dividida por ${salesCount} ${salesCount === 1 ? "venda" : "vendas"} e ${serviceCount} ${serviceCount === 1 ? "serviço" : "serviços"}`
            : `Receita do período dividida por ${salesCount} ${salesCount === 1 ? "venda" : "vendas"}`
        }
      />
      <KpiCard
        label="Taxa de retenção"
        icon={Repeat}
        value={`${(retentionRate * 100).toFixed(1)}%`}
        footer={`Clientes que compraram mais de uma vez entre ${buyersCount} ${buyersCount === 1 ? "comprador" : "compradores"} no período`}
      />
    </div>
  );
}
