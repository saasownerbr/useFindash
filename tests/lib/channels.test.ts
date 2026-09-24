import { describe, expect, it } from "vitest";

import { CHANNEL_COLORS, channelColors, channelLabel } from "@/lib/channels";
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
