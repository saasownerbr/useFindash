import { Card, CardContent } from "@/components/ui/card";
import type { DRE } from "@/lib/dre";
import { formatCurrencyBRL } from "@/lib/finance";

export function KpiCards({ dre }: { dre: DRE }) {
  const items = [
    { label: "Faturamento", value: formatCurrencyBRL(dre.revenue) },
    { label: "CMV", value: formatCurrencyBRL(dre.cmv) },
    { label: "Margem bruta", value: `${(dre.grossMarginPct * 100).toFixed(1)}%` },
    { label: "Margem líquida", value: formatCurrencyBRL(dre.netMargin) },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-xl font-bold text-foreground">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
