import { RankingList } from "@/components/rankings/ranking-list";
import { formatCurrencyBRL } from "@/lib/finance";
import type { SellerRankRow } from "@/lib/rankings";

export function SellerRanking({ rows }: { rows: SellerRankRow[] }) {
  const items = [...rows]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .map((row) => ({
      key: row.sellerId,
      name: row.name,
      value: formatCurrencyBRL(row.totalRevenue),
      details: [
        `Ticket médio ${formatCurrencyBRL(row.avgTicket)}`,
        `${row.avgAccessoriesPerSale.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} acessório por venda`,
        `Comissão ${formatCurrencyBRL(row.totalCommission)}`,
      ],
    }));

  return <RankingList items={items} emptyMessage="Nenhuma venda neste mês." />;
}
