import { formatCurrencyBRL } from "@/lib/finance";
import type { SellerRankRow } from "@/lib/rankings";

export function SellerRanking({ rows }: { rows: SellerRankRow[] }) {
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
            <th className="px-4 py-3">Vendedor</th>
            <th className="px-4 py-3">Vendas</th>
            <th className="px-4 py-3">Volume</th>
            <th className="px-4 py-3">Ticket médio</th>
            <th className="px-4 py-3">Acessórios/venda</th>
            <th className="px-4 py-3">Comissão</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.sellerId} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
              <td className="px-4 py-3">{row.salesCount}</td>
              <td className="px-4 py-3">{formatCurrencyBRL(row.totalRevenue)}</td>
              <td className="px-4 py-3">{formatCurrencyBRL(row.avgTicket)}</td>
              <td className="px-4 py-3">{row.avgAccessoriesPerSale.toFixed(1)}</td>
              <td className="px-4 py-3">{formatCurrencyBRL(row.totalCommission)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
