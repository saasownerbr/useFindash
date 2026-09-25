import { describe, expect, it } from "vitest";

import { CHANNEL_COLORS, channelColors, channelLabel, salesByChannel } from "@/lib/channels";
import { SALE_CHANNELS } from "@/lib/validation/sale";

describe("channels", () => {
  it("gives every sale channel its own color", () => {
    const colors = SALE_CHANNELS.map((c) => CHANNEL_COLORS[c]?.color);
    expect(colors.every(Boolean)).toBe(true);
    expect(new Set(colors).size).toBe(SALE_CHANNELS.length);
  });

  it("uses the brand colors", () => {
    expect(channelColors("instagram")).toEqual({ color: "#E1306C", background: "rgba(225,48,108,0.12)" });
    expect(channelColors("paid_traffic").color).toBe("#3B82F6");
  });

  it("falls back for unknown or empty channels", () => {
    expect(channelLabel(null)).toBe("—");
    expect(channelLabel("tiktok")).toBe("tiktok");
    expect(channelColors("tiktok").color).toBe("#9CA3AF");
  });
});

describe("salesByChannel", () => {
  it("counts sales and sums device + accessory revenue per channel, in channel order, skipping empty channels", () => {
    const result = salesByChannel([
      { sale_channel: "whatsapp", sale_price: 5000, sale_accessories: [{ quantity: 2, unit_price: 50 }] },
      { sale_channel: "instagram", sale_price: 4000, sale_accessories: [] },
      { sale_channel: "whatsapp", sale_price: 3000 },
    ]);
    expect(result).toEqual([
      { channel: "instagram", label: "Instagram", count: 1, revenue: 4000 },
      { channel: "whatsapp", label: "WhatsApp", count: 2, revenue: 8100 },
    ]);
  });

  it("returns nothing when there are no sales", () => {
    expect(salesByChannel([])).toEqual([]);
  });
});
