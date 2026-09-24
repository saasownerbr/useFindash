import { describe, expect, it } from "vitest";

import { whatsappLink } from "@/lib/whatsapp";

describe("whatsappLink", () => {
  it("adds the Brazil country code to a masked number", () => {
    expect(whatsappLink("(11) 98765-4321")).toBe("https://wa.me/5511987654321");
  });

  it("keeps a number that already has the country code", () => {
    expect(whatsappLink("+55 11 98765-4321")).toBe("https://wa.me/5511987654321");
  });

  it("encodes a message", () => {
    expect(whatsappLink("11987654321", "Olá!")).toBe("https://wa.me/5511987654321?text=Ol%C3%A1!");
  });

  it("returns null for numbers too short to dial", () => {
    expect(whatsappLink("1234")).toBeNull();
  });
});
