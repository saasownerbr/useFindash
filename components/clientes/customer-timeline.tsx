import { ChannelBadge } from "@/components/ui/channel-badge";
import { formatCurrencyBRL } from "@/lib/finance";

type TimelineSale = {
  id: string;
  sold_at: string;
  sale_price: number;
  sale_channel: string;
};

export function CustomerTimeline({ sales }: { sales: TimelineSale[] }) {
  if (sales.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Nenhuma compra registrada ainda.
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-4">
      {sales.map((sale) => (
        <li key={sale.id} className="flex items-start gap-3 border-l-2 border-border pl-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {new Date(sale.sold_at).toLocaleDateString("pt-BR")}
              </span>
              <ChannelBadge channel={sale.sale_channel} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{formatCurrencyBRL(sale.sale_price)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
