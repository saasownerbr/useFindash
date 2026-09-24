import { describe, it, expect } from "vitest";

import { rankSellers, rankProducts, rankChannels, sellerDisplayName } from "@/lib/rankings";

const sales = [
  {
    seller_id: "s1",
    sale_price: 1000,
    gross_margin: 300,
    commission_amount: 50,
    sale_channel: "pdv",
    model: "iPhone 13",
    storage: "128GB",
    accessoryCount: 2,
  },
  {
    seller_id: "s1",
    sale_price: 2000,
    gross_margin: 600,
    commission_amount: 100,
    sale_channel: "instagram",
    model: "iPhone 13",
    storage: "128GB",
    accessoryCount: 0,
  },
  {
    seller_id: "s2",
    sale_price: 1500,
    gross_margin: 400,
    commission_amount: 75,
    sale_channel: "pdv",
    model: "iPhone 12",
    storage: "64GB",
    accessoryCount: 1,
  },
];
const sellers = [
  { id: "s1", name: "Ana" },
  { id: "s2", name: "Bruno" },
];

describe("sellerDisplayName", () => {
  it("keeps a real name", () => {
    expect(sellerDisplayName(" Ana Souza ")).toBe("Ana Souza");
  });
  it("turns an email into a name", () => {
    expect(sellerDisplayName("joao.silva@loja.com")).toBe("Joao Silva");
    expect(sellerDisplayName("MARIA_lima@x.com")).toBe("Maria Lima");
  });
});

describe("rankSellers", () => {
  it("shows the name instead of the email", () => {
    const result = rankSellers([sales[0]], [{ id: "s1", name: "ana.souza@loja.com" }]);
    expect(result[0].name).toBe("Ana Souza");
  });

  it("aggregates volume, average ticket, accessories per sale and commission per seller", () => {
    const result = rankSellers(sales, sellers);
    const ana = result.find((r) => r.sellerId === "s1")!;
    expect(ana.salesCount).toBe(2);
    expect(ana.totalRevenue).toBe(3000);
    expect(ana.avgTicket).toBe(1500);
    expect(ana.avgAccessoriesPerSale).toBe(1);
    expect(ana.totalCommission).toBe(150);
  });
  it("returns an empty array for no sales", () => {
    expect(rankSellers([], sellers)).toEqual([]);
  });
  it("labels a seller no longer in the sellers list as removed", () => {
    const result = rankSellers([{ ...sales[0], seller_id: "gone" }], sellers);
    expect(result[0].name).toBe("Vendedor removido");
  });
});

describe("rankProducts", () => {
  it("groups by model+storage and averages gross margin", () => {
    const result = rankProducts(sales);
    const iphone13 = result.find((r) => r.model === "iPhone 13" && r.storage === "128GB")!;
    expect(iphone13.unitsSold).toBe(2);
    expect(iphone13.avgGrossMargin).toBe(450);
  });
  it("returns an empty array for no sales", () => {
    expect(rankProducts([])).toEqual([]);
  });
});

describe("rankChannels", () => {
  it("computes total revenue and percentage share per channel", () => {
    const result = rankChannels(sales);
    const pdv = result.find((r) => r.channel === "pdv")!;
    expect(pdv.totalRevenue).toBe(2500);
    expect(pdv.percentage).toBeCloseTo(2500 / 4500);
  });
  it("returns an empty array for no sales, never divides by zero", () => {
    expect(rankChannels([])).toEqual([]);
  });
});
