"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PAYMENT_BREAKDOWN_KEYS, type PaymentBreakdown } from "@/lib/payment-methods";

// Brand ramp from the logo file: lime, olive and grays.
const METHODS: Record<keyof PaymentBreakdown, { label: string; color: string }> = {
  pix: { label: "PIX", color: "#dae878" },
  cash: { label: "Dinheiro", color: "#c2cf5f" },
  debit: { label: "Débito", color: "#abb250" },
  credit: { label: "Crédito", color: "#8b8b8b" },
  boleto: { label: "Boleto", color: "#5c5c5c" },
};

export function PaymentMethodsChart({ data }: { data: PaymentBreakdown }) {
  const total = PAYMENT_BREAKDOWN_KEYS.reduce((sum, key) => sum + data[key], 0);
  const items = PAYMENT_BREAKDOWN_KEYS.map((key) => ({
    key,
    ...METHODS[key],
    percent: total === 0 ? 0 : (data[key] / total) * 100,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#808080]">
          Métodos de Pagamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stacked bar, 8px tall */}
        <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-[#242424]">
          {items
            .filter((item) => item.percent > 0)
            .map((item) => (
              <div
                key={item.key}
                className="h-full transition-all"
                style={{ width: `${item.percent}%`, backgroundColor: item.color }}
              />
            ))}
        </div>

        {/* Legend: methods with sales in the period; all of them at 0% when there are none. */}
        <div className="flex flex-wrap items-center justify-start gap-x-4 gap-y-2">
          {items
            .filter((item) => total === 0 || item.percent > 0)
            .map((item) => (
              <div key={item.key} className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className="text-xs font-semibold text-foreground">{item.percent.toFixed(0)}%</span>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
