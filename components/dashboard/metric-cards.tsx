import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyBRL } from "@/lib/finance";

const CHANNEL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  pdv: "Loja física",
  referral: "Indicação",
  paid_traffic: "Tráfego pago",
};

export function MetricCards({
  avgLtv,
  cacByChannel,
  retentionRate,
}: {
  avgLtv: number;
  cacByChannel: { channel: string; cac: number }[];
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
          <p className="mb-2 text-xs text-muted-foreground">CAC por canal</p>
          <div className="space-y-1">
            {cacByChannel.map((item) => (
              <div key={item.channel} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{CHANNEL_LABELS[item.channel] ?? item.channel}</span>
                <span className="text-muted-foreground">
                  {item.cac > 0 ? formatCurrencyBRL(item.cac) : "R$ 0,00 (orgânico)"}
                </span>
              </div>
            ))}
          </div>
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
