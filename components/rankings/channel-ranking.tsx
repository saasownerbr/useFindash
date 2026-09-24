import { RankingList } from "@/components/rankings/ranking-list";
import { ChannelBadge } from "@/components/ui/channel-badge";
import { formatCurrencyBRL } from "@/lib/finance";
import type { ChannelRankRow } from "@/lib/rankings";

export function ChannelRanking({ rows }: { rows: ChannelRankRow[] }) {
  const items = [...rows]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .map((row) => ({
      key: row.channel,
      name: <ChannelBadge channel={row.channel} />,
      center: <span className="font-semibold tabular-nums text-[#F8F8F8]">{formatCurrencyBRL(row.totalRevenue)}</span>,
      right: (
        <span className="text-[#9CA3AF]">
          {(row.percentage * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% do total
        </span>
      ),
    }));

  return <RankingList title="Canais" items={items} emptyMessage="Nenhuma venda neste mês." />;
}
