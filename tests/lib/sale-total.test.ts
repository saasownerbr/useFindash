import { describe, expect, it } from "vitest";

import { accessoriesTotal, productPrice, splitSaleTotal } from "@/lib/sale-total";

const capinha = { quantity: 2, unitPrice: 50 };
const pelicula = { quantity: 1, unitPrice: 100 };

describe("productPrice", () => {
  it("prefers the final price, then the suggested one", () => {
    const base = { id: "p", model: "iPhone 13", storage: "128GB", color: null, imei: null, grade: null, acquisitionCost: 0, repairCost: 0 };
    expect(productPrice({ ...base, finalPrice: 3000, suggestedPrice: 2800 })).toBe(3000);
    expect(productPrice({ ...base, finalPrice: null, suggestedPrice: 2800 })).toBe(2800);
    expect(productPrice(null)).toBe(0);
  });
});

describe("splitSaleTotal", () => {
  it("keeps accessory prices and gives the device the rest", () => {
    expect(accessoriesTotal([capinha, pelicula])).toBe(200);
    expect(splitSaleTotal(3200, [capinha, pelicula])).toEqual({ devicePrice: 3000, accessories: [capinha, pelicula] });
  });

  it("puts a discount on the device", () => {
    expect(splitSaleTotal(3100, [capinha, pelicula]).devicePrice).toBe(2900);
  });

  it("scales accessories down when the total is below them, keeping the revenue equal to the total", () => {
    const { devicePrice, accessories } = splitSaleTotal(150, [capinha, pelicula]);
    expect(devicePrice).toBe(0);
    expect(accessoriesTotal(accessories)).toBe(150);
  });
});
