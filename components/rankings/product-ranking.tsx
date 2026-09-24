import { RankingList } from "@/components/rankings/ranking-list";
import { formatCurrencyBRL } from "@/lib/finance";
import type { ProductRankRow } from "@/lib/rankings";

export function ProductRanking({ rows }: { rows: ProductRankRow[] }) {
  const items = [...rows]
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .map((row) => ({
      key: `${row.model}-${row.storage}`,
      name: `${row.model} · ${row.storage}`,
      center: <span className="text-[#10B981]">Margem média {formatCurrencyBRL(row.avgGrossMargin)}</span>,
      right: (
        <span className="text-[#808080]">
          {row.unitsSold} {row.unitsSold === 1 ? "unidade" : "unidades"}
        </span>
      ),
    }));

  return <RankingList title="Produtos" items={items} emptyMessage="Nenhum aparelho vendido neste mês." />;
}
