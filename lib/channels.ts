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
