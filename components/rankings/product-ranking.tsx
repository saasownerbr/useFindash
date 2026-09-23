import { formatCurrencyBRL } from "@/lib/finance";
import type { ProductRankRow } from "@/lib/rankings";

export function ProductRanking({ rows }: { rows: ProductRankRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Nenhum aparelho vendido neste mês.
      </div>
    );
  }

  const sorted = [...rows].sort((a, b) => b.unitsSold - a.unitsSold);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-card text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Modelo</th>
            <th className="px-4 py-3">Unidades vendidas</th>
            <th className="px-4 py-3">Margem média</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={`${row.model}-${row.storage}`} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-medium text-foreground">
                {row.model} · {row.storage}
              </td>
              <td className="px-4 py-3">{row.unitsSold}</td>
              <td className="px-4 py-3">{formatCurrencyBRL(row.avgGrossMargin)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
