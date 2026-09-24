type SaleForRanking = {
  seller_id: string;
  sale_price: number;
  gross_margin: number;
  commission_amount: number | null;
  sale_channel: string;
  model: string | null;
  storage: string | null;
  accessoryCount: number;
};
type SellerRow = { id: string; name: string };

export type SellerRankRow = {
  sellerId: string;
  name: string;
  salesCount: number;
  totalRevenue: number;
  avgTicket: number;
  avgAccessoriesPerSale: number;
  totalCommission: number;
};

/**
 * Store owners were created with their email as the seller name. Rankings show
 * a person's name, so an email becomes its local part in title case
 * ("joao.silva@loja.com" -> "Joao Silva").
 */
export function sellerDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed.includes("@")) return trimmed;
  const local = trimmed.split("@")[0];
  const words = local.split(/[._\-+]+/).filter(Boolean);
  if (words.length === 0) return trimmed;
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

export function rankSellers(sales: SaleForRanking[], sellers: SellerRow[]): SellerRankRow[] {
  const byId = new Map(sellers.map((s) => [s.id, s.name]));
  const groups = new Map<string, SaleForRanking[]>();
  for (const sale of sales) {
    const list = groups.get(sale.seller_id) ?? [];
    list.push(sale);
    groups.set(sale.seller_id, list);
  }
  return Array.from(groups.entries()).map(([sellerId, group]) => {
    const totalRevenue = group.reduce((sum, s) => sum + Number(s.sale_price), 0);
    const totalCommission = group.reduce((sum, s) => sum + Number(s.commission_amount ?? 0), 0);
    const totalAccessories = group.reduce((sum, s) => sum + s.accessoryCount, 0);
    return {
      sellerId,
      name: byId.has(sellerId) ? sellerDisplayName(byId.get(sellerId)!) : "Vendedor removido",
      salesCount: group.length,
      totalRevenue,
      avgTicket: totalRevenue / group.length,
      avgAccessoriesPerSale: totalAccessories / group.length,
      totalCommission,
    };
  });
}

export type ProductRankRow = { model: string; storage: string; unitsSold: number; avgGrossMargin: number };

export function rankProducts(sales: SaleForRanking[]): ProductRankRow[] {
  const groups = new Map<string, SaleForRanking[]>();
  for (const sale of sales) {
    if (!sale.model || !sale.storage) continue;
    const key = `${sale.model}::${sale.storage}`;
    const list = groups.get(key) ?? [];
    list.push(sale);
    groups.set(key, list);
  }
  return Array.from(groups.entries()).map(([key, group]) => {
    const [model, storage] = key.split("::");
    const avgGrossMargin = group.reduce((sum, s) => sum + Number(s.gross_margin), 0) / group.length;
    return { model, storage, unitsSold: group.length, avgGrossMargin };
  });
}

export type ChannelRankRow = { channel: string; totalRevenue: number; percentage: number };

export function rankChannels(sales: SaleForRanking[]): ChannelRankRow[] {
  if (sales.length === 0) return [];
  const totalAll = sales.reduce((sum, s) => sum + Number(s.sale_price), 0);
  const groups = new Map<string, number>();
  for (const sale of sales) {
    groups.set(sale.sale_channel, (groups.get(sale.sale_channel) ?? 0) + Number(sale.sale_price));
  }
  return Array.from(groups.entries()).map(([channel, totalRevenue]) => ({
    channel,
    totalRevenue,
    percentage: totalAll > 0 ? totalRevenue / totalAll : 0,
  }));
}
