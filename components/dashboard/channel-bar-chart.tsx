"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import { channelColors, channelLabel } from "@/lib/channels";

export function ChannelBarChart({ data }: { data: { channel: string; total: number }[] }) {
  const chartData = data.map((d) => ({ ...d, label: channelLabel(d.channel) }));

  return (
    <Card>
      <CardContent className="p-4">
        <p className="mb-4 text-sm font-medium text-foreground">Vendas por canal (mês atual)</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {chartData.map((d) => (
                  <Cell key={d.channel} fill={channelColors(d.channel).color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
