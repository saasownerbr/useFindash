"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";

import type { ChannelSales } from "@/lib/channels";
import { CHART_AXIS, CHART_GRID, CHART_TOOLTIP } from "@/lib/chart-theme";
import { formatCurrencyBRL } from "@/lib/finance";

const COUNT_COLOR = "#dae878";
const REVENUE_COLOR = "#10B981";

const compactBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" });

function ChannelTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as ChannelSales;
  return (
    <div style={CHART_TOOLTIP.contentStyle} className="px-3 py-2">
      <p className="mb-1 font-semibold text-foreground">{row.label}</p>
      <p className="text-[#808080]">
        Vendas: <span className="tabular-nums text-foreground">{row.count}</span>
      </p>
      <p className="text-[#808080]">
        Receita: <span className="tabular-nums text-foreground">{formatCurrencyBRL(row.revenue)}</span>
      </p>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      {label}
    </span>
  );
}

/** Sales count (left axis) and revenue (right axis) per channel for the selected period. */
export function SalesByChannelChart({ data }: { data: ChannelSales[] }) {
  return (
    <section className="rounded-2xl border border-[#242424] bg-[#1A1A1A] p-5">
      <h2 className="mb-4 text-[13px] font-semibold uppercase text-[#9CA3AF]">Vendas por Canal</h2>
      {data.length === 0 ? (
        <p className="flex h-[180px] items-center justify-center text-sm text-muted-foreground md:h-[240px]">
          Nenhuma venda no período.
        </p>
      ) : (
        <div className="h-[180px] md:h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 0, right: 0, top: 4, bottom: 0 }} barGap={4}>
              <CartesianGrid {...CHART_GRID} />
              <XAxis dataKey="label" {...CHART_AXIS} interval={0} />
              <YAxis yAxisId="count" {...CHART_AXIS} allowDecimals={false} width={32} />
              <YAxis
                yAxisId="revenue"
                orientation="right"
                {...CHART_AXIS}
                tickFormatter={(value) => compactBRL.format(value)}
                width={64}
              />
              <Tooltip content={<ChannelTooltip />} cursor={CHART_TOOLTIP.cursor} />
              <Bar yAxisId="count" dataKey="count" name="Quantidade de vendas" fill={COUNT_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar yAxisId="revenue" dataKey="revenue" name="Receita (R$)" fill={REVENUE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <LegendDot color={COUNT_COLOR} label="Quantidade de vendas" />
        <LegendDot color={REVENUE_COLOR} label="Receita (R$)" />
      </div>
    </section>
  );
}
