import { RankingList } from "@/components/rankings/ranking-list";
import { formatCurrencyBRL } from "@/lib/finance";
import type { ProductRankRow } from "@/lib/rankings";

export function ProductRanking({ rows }: { rows: ProductRankRow[] }) {
  const items = [...rows]
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .map((row) => ({
      key: `${row.model}-${row.storage}`,
      name: `${row.model} · ${row.storage}`,
      value: `${row.unitsSold} ${row.unitsSold === 1 ? "unidade" : "unidades"}`,
      details: [`Margem média ${formatCurrencyBRL(row.avgGrossMargin)}`],
    }));

  return <RankingList items={items} emptyMessage="Nenhum aparelho vendido neste mês." />;
}
