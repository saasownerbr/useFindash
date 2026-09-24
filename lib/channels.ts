export const CHANNEL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  pdv: "Loja física",
  referral: "Indicação",
  paid_traffic: "Tráfego pago",
};

/** One hue per channel so the same channel reads the same everywhere. */
export const CHANNEL_COLORS: Record<string, string> = {
  instagram: "#EC4899",
  whatsapp: "#22C55E",
  pdv: "#3B82F6",
  referral: "#F59E0B",
  paid_traffic: "#8B5CF6",
};

const FALLBACK_COLOR = "#9CA3AF";

export function channelLabel(channel: string | null | undefined): string {
  if (!channel) return "—";
  return CHANNEL_LABELS[channel] ?? channel;
}

export function channelColor(channel: string | null | undefined): string {
  return (channel && CHANNEL_COLORS[channel]) || FALLBACK_COLOR;
}
