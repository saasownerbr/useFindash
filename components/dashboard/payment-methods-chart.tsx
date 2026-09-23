"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PaymentMethodData {
  pix: number;
  debit: number;
  credit: number;
}

interface PaymentMethodsChartProps {
  data: PaymentMethodData;
}

const COLORS = {
  pix: "#10B981",
  debit: "#3B82F6",
  credit: "#8B5CF6",
};

export function PaymentMethodsChart({ data }: PaymentMethodsChartProps) {
  const total = data.pix + data.debit + data.credit;

  const getPercentage = (value: number) => {
    if (total === 0) return "0%";
    return `${((value / total) * 100).toFixed(0)}%`;
  };

  const pixPercent = total === 0 ? 0 : (data.pix / total) * 100;
  const debitPercent = total === 0 ? 0 : (data.debit / total) * 100;
  const creditPercent = total === 0 ? 0 : (data.credit / total) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Métodos de Pagamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stacked bar */}
        <div className="flex h-2 overflow-hidden rounded-full bg-card/50" style={{ backgroundColor: "#2A2A2A" }}>
          {pixPercent > 0 && (
            <div
              className="transition-all"
              style={{
                width: `${pixPercent}%`,
                backgroundColor: COLORS.pix,
                borderRadius: pixPercent === 100 ? "999px" : debitPercent === 0 && creditPercent === 0 ? "0 999px 999px 0" : "0",
              }}
            />
          )}
          {debitPercent > 0 && (
            <div
              className="transition-all"
              style={{
                width: `${debitPercent}%`,
                backgroundColor: COLORS.debit,
              }}
            />
          )}
          {creditPercent > 0 && (
            <div
              className="transition-all"
              style={{
                width: `${creditPercent}%`,
                backgroundColor: COLORS.credit,
                borderRadius: creditPercent === 100 ? "999px" : "0 999px 999px 0",
              }}
            />
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-start gap-4">
          {[
            { key: "pix", label: "PIX", value: data.pix, percent: pixPercent },
            { key: "debit", label: "Débito", value: data.debit, percent: debitPercent },
            { key: "credit", label: "Crédito", value: data.credit, percent: creditPercent },
          ].map((item) => (
            <div key={item.key} className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: COLORS[item.key as keyof typeof COLORS] }}
              />
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <span className="text-xs font-semibold text-foreground">{getPercentage(item.value)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
