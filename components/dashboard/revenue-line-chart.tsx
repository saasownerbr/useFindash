"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import { CHART_AXIS, CHART_GRID, CHART_PRIMARY, CHART_TOOLTIP } from "@/lib/chart-theme";
import { formatCurrencyBRL } from "@/lib/finance";

const compactBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" });

export function RevenueLineChart({ data }: { data: { month: string; revenue: number }[] }) {
  return (
    <Card>
      <CardContent className="pt-4 md:pt-5">
        <p className="mb-4 text-[13px] font-semibold text-foreground">Faturamento — últimos 6 meses</p>
        <div className="h-40 md:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_PRIMARY} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={CHART_PRIMARY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...CHART_GRID} />
              <XAxis dataKey="month" {...CHART_AXIS} />
              <YAxis {...CHART_AXIS} tickFormatter={(value) => compactBRL.format(value)} width={72} />
              <Tooltip formatter={(value: number) => formatCurrencyBRL(value)} {...CHART_TOOLTIP} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Faturamento"
                stroke={CHART_PRIMARY}
                strokeWidth={2.5}
                fill="url(#revenueFill)"
                dot={false}
                activeDot={{ r: 5, fill: CHART_PRIMARY, stroke: "#0F0F0F", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
