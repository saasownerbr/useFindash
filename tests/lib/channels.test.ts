import { describe, expect, it } from "vitest";

import { CHANNEL_COLORS, channelColor, channelLabel } from "@/lib/channels";
import { SALE_CHANNELS } from "@/lib/validation/sale";

describe("channels", () => {
  it("gives every sale channel its own color", () => {
    const colors = SALE_CHANNELS.map((c) => CHANNEL_COLORS[c]);
    expect(colors.every(Boolean)).toBe(true);
    expect(new Set(colors).size).toBe(SALE_CHANNELS.length);
  });

  it("falls back for unknown or empty channels", () => {
    expect(channelLabel(null)).toBe("—");
    expect(channelLabel("tiktok")).toBe("tiktok");
    expect(channelColor("tiktok")).toBe("#9CA3AF");
  });
});
