import { describe, it, expect } from "vitest";

import { saleSchema } from "@/lib/validation/sale";

const base = {
  customer_id: "11111111-1111-1111-1111-111111111111",
  seller_id: "22222222-2222-2222-2222-222222222222",
  product_id: null,
  sale_channel: "pdv" as const,
  sale_price: "100",
  payment_method: "pix",
  installments: "1",
  accessories: [] as { accessory_id: string; quantity: string; unit_price: string }[],
};

describe("saleSchema", () => {
  it("rejects a sale with no product and no accessories", () => {
    const result = saleSchema.safeParse(base);
    expect(result.success).toBe(false);
  });
  it("accepts a sale with a product and no accessories", () => {
    const result = saleSchema.safeParse({ ...base, product_id: "33333333-3333-3333-3333-333333333333" });
    expect(result.success).toBe(true);
  });
  it("accepts a sale with no product but at least one accessory", () => {
    const result = saleSchema.safeParse({
      ...base,
      accessories: [{ accessory_id: "44444444-4444-4444-4444-444444444444", quantity: "1", unit_price: "50" }],
    });
    expect(result.success).toBe(true);
  });
  it("rejects a non-positive sale price", () => {
    const result = saleSchema.safeParse({
      ...base,
      product_id: "33333333-3333-3333-3333-333333333333",
      sale_price: "0",
    });
    expect(result.success).toBe(false);
  });
});
