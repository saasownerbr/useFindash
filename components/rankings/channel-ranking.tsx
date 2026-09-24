import { RankingList } from "@/components/rankings/ranking-list";
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
  const items = [...rows]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .map((row) => ({
      key: row.channel,
      name: CHANNEL_LABELS[row.channel] ?? row.channel,
      value: formatCurrencyBRL(row.totalRevenue),
      details: [`${(row.percentage * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% do total`],
    }));

  return <RankingList items={items} emptyMessage="Nenhuma venda neste mês." />;
}
