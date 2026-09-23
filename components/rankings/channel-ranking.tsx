import { formatCurrencyBRL } from "@/lib/finance";
import type { ChannelRankRow } from "@/lib/rankings";

const CHANNEL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  pdv: "Loja física",
  referral: "Indicação",
  paid_traffic: "Tráfego pago",
};

export function ChannelRanking({ rows }: { rows: ChannelRankRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Nenhuma venda neste mês.
      </div>
    );
  }

  const sorted = [...rows].sort((a, b) => b.totalRevenue - a.totalRevenue);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-card text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Canal</th>
            <th className="px-4 py-3">Receita total</th>
            <th className="px-4 py-3">% do total</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.channel} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-medium text-foreground">{CHANNEL_LABELS[row.channel] ?? row.channel}</td>
              <td className="px-4 py-3">{formatCurrencyBRL(row.totalRevenue)}</td>
              <td className="px-4 py-3">{(row.percentage * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
