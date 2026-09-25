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

  it.each([
    ["11987654321", "https://wa.me/5511987654321"],
    ["(11) 9 8765-4321", "https://wa.me/5511987654321"],
    ["011 98765-4321", "https://wa.me/5511987654321"],
    ["55 (11) 98765 4321", "https://wa.me/5511987654321"],
    ["(11) 3322-4455", "https://wa.me/551133224455"],
  ])("builds the link for %s", (phone, expected) => {
    expect(whatsappLink(phone)).toBe(expected);
  });

  it("returns null when there is no number", () => {
    expect(whatsappLink("")).toBeNull();
    expect(whatsappLink(null)).toBeNull();
  });

  it("returns null for numbers too short to dial", () => {
    expect(whatsappLink("1234")).toBeNull();
  });
});
