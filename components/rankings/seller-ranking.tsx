import { RankingList } from "@/components/rankings/ranking-list";
import { formatCurrencyBRL } from "@/lib/finance";
import type { SellerRankRow } from "@/lib/rankings";

export function SellerRanking({ rows }: { rows: SellerRankRow[] }) {
  const items = [...rows]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .map((row) => ({
      key: row.sellerId,
      name: row.name,
      center: (
        <div>
          <p className="font-semibold tabular-nums text-[#F0F0F0]">{formatCurrencyBRL(row.totalRevenue)}</p>
          <p className="text-xs text-[#808080]">
            Ticket médio {formatCurrencyBRL(row.avgTicket)} · {row.salesCount} {row.salesCount === 1 ? "venda" : "vendas"}
          </p>
        </div>
      ),
      right: <span className="tabular-nums text-[#10B981]">Comissão {formatCurrencyBRL(row.totalCommission)}</span>,
    }));

  return <RankingList title="Vendedores" items={items} emptyMessage="Nenhuma venda neste mês." />;
}
