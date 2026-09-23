"use client";

import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
  credit: "#F59E0B",
};

export function PaymentMethodsChart({ data }: PaymentMethodsChartProps) {
  const total = data.pix + data.debit + data.credit;
  const chartData = [
    {
      name: "Métodos",
      PIX: data.pix,
      "Débito": data.debit,
      "Crédito": data.credit,
    },
  ];

  const getPercentage = (value: number) => {
    if (total === 0) return "0%";
    return `${((value / total) * 100).toFixed(0)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Métodos de Pagamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ResponsiveContainer width="100%" height={120}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" hide />
            <Tooltip
              formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              labelStyle={{ color: "#F8F8F8" }}
              contentStyle={{ backgroundColor: "#1A1A1A", border: "1px solid #2A2A2A" }}
            />
            <Bar dataKey="PIX" stackId="a" fill={COLORS.pix} />
            <Bar dataKey="Débito" stackId="a" fill={COLORS.debit} />
            <Bar dataKey="Crédito" stackId="a" fill={COLORS.credit} />
          </BarChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-md bg-secondary/30 p-2">
            <div className="mb-1 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.pix }} />
              <span className="font-medium text-foreground">PIX</span>
            </div>
            <div className="text-muted-foreground">
              {getPercentage(data.pix)}
            </div>
          </div>
          <div className="rounded-md bg-secondary/30 p-2">
            <div className="mb-1 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.debit }} />
              <span className="font-medium text-foreground">Débito</span>
            </div>
            <div className="text-muted-foreground">
              {getPercentage(data.debit)}
            </div>
          </div>
          <div className="rounded-md bg-secondary/30 p-2">
            <div className="mb-1 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.credit }} />
              <span className="font-medium text-foreground">Crédito</span>
            </div>
            <div className="text-muted-foreground">
              {getPercentage(data.credit)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
