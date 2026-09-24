import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyBRL } from "@/lib/finance";

export interface PaidTrafficMetrics {
  cac: number;
  salesCount: number;
  investment: number;
}

export function MetricCards({
  avgLtv,
  paidTraffic,
  retentionRate,
}: {
  avgLtv: number;
  paidTraffic: PaidTrafficMetrics;
  retentionRate: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">LTV médio</p>
          <p className="text-xl font-bold text-foreground">{formatCurrencyBRL(avgLtv)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">CAC Tráfego Pago</p>
          {paidTraffic.investment > 0 ? (
            <>
              <p className="text-xl font-bold text-foreground">
                {paidTraffic.salesCount > 0 ? formatCurrencyBRL(paidTraffic.cac) : "—"}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  {paidTraffic.salesCount} {paidTraffic.salesCount === 1 ? "venda" : "vendas"} de tráfego pago
                </span>
                <span>Investimento no mês {formatCurrencyBRL(paidTraffic.investment)}</span>
              </div>
            </>
          ) : (
            <Link href="/financeiro?tab=trafego" className="mt-1 block text-sm text-primary hover:underline">
              Configure o investimento no módulo Financeiro
            </Link>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Taxa de retenção</p>
          <p className="text-xl font-bold text-foreground">{(retentionRate * 100).toFixed(1)}%</p>
        </CardContent>
      </Card>
    </div>
  );
}
