export const CHANNEL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  pdv: "Loja física",
  referral: "Indicação",
  paid_traffic: "Tráfego pago",
};

/** One hue per channel so the same channel reads the same everywhere. */
export const CHANNEL_COLORS: Record<string, { color: string; background: string }> = {
  instagram: { color: "#E1306C", background: "rgba(225,48,108,0.12)" },
  whatsapp: { color: "#25D366", background: "rgba(37,211,102,0.12)" },
  pdv: { color: "#F59E0B", background: "rgba(245,158,11,0.12)" },
  referral: { color: "#8B5CF6", background: "rgba(139,92,246,0.12)" },
  paid_traffic: { color: "#3B82F6", background: "rgba(59,130,246,0.12)" },
};

const FALLBACK = { color: "#9CA3AF", background: "rgba(156,163,175,0.12)" };

export function channelLabel(channel: string | null | undefined): string {
  if (!channel) return "—";
  return CHANNEL_LABELS[channel] ?? channel;
}

export function channelColors(channel: string | null | undefined): { color: string; background: string } {
  return (channel && CHANNEL_COLORS[channel]) || FALLBACK;
}

export type ChannelSales = { channel: string; label: string; count: number; revenue: number };

/**
 * Sales count and revenue (device + accessories) per channel, in the usual channel order. Channels with no sale
 * in the period are left out so the chart has no empty bars.
 */
export function salesByChannel(
  sales: { sale_channel: string; sale_price: number; sale_accessories?: { quantity: number; unit_price: number }[] | null }[]
): ChannelSales[] {
  const totals = new Map<string, { count: number; revenue: number }>();
  for (const sale of sales) {
    const accessories = (sale.sale_accessories ?? []).reduce((sum, a) => sum + a.quantity * Number(a.unit_price), 0);
    const current = totals.get(sale.sale_channel) ?? { count: 0, revenue: 0 };
    totals.set(sale.sale_channel, { count: current.count + 1, revenue: current.revenue + Number(sale.sale_price) + accessories });
  }
  const order = [...Object.keys(CHANNEL_LABELS), ...Array.from(totals.keys()).filter((c) => !(c in CHANNEL_LABELS))];
  return order
    .filter((channel) => totals.has(channel))
    .map((channel) => ({ channel, label: channelLabel(channel), ...totals.get(channel)! }));
}
