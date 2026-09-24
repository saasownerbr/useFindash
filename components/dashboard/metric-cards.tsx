import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyBRL } from "@/lib/finance";

export function MetricCards({
  avgLtv,
  paidTrafficCac,
  retentionRate,
}: {
  avgLtv: number;
  paidTrafficCac: number;
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
          <p className="text-xs text-muted-foreground">CAC · Tráfego pago</p>
          <p className="text-xl font-bold text-foreground">{formatCurrencyBRL(paidTrafficCac)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Investimento em tráfego pago por cliente adquirido</p>
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
