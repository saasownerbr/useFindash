import { RankingList } from "@/components/rankings/ranking-list";
import { formatCurrencyBRL } from "@/lib/finance";
import { channelColor, channelLabel } from "@/lib/channels";
import type { ChannelRankRow } from "@/lib/rankings";

export function ChannelRanking({ rows }: { rows: ChannelRankRow[] }) {
  const items = [...rows]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .map((row) => ({
      key: row.channel,
      name: channelLabel(row.channel),
      accent: channelColor(row.channel),
      value: formatCurrencyBRL(row.totalRevenue),
      details: [`${(row.percentage * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% do total`],
    }));

  return <RankingList items={items} emptyMessage="Nenhuma venda neste mês." />;
}
