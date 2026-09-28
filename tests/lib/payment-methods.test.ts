import { describe, expect, it } from "vitest";

import { paymentBreakdown, paymentBucket } from "@/lib/payment-methods";

describe("paymentBreakdown", () => {
  it("counts every method the wizard offers, with accessories", () => {
    const totals = paymentBreakdown([
      { payment_method: "Pix", sale_price: 1000, sale_accessories: [{ quantity: 2, unit_price: 50 }] },
      { payment_method: "Dinheiro", sale_price: 300 },
      { payment_method: "Cartão de débito", sale_price: 200 },
      { payment_method: "Cartão de Crédito", sale_price: 5000 },
      { payment_method: "Boleto", sale_price: 400 },
    ]);
    expect(totals).toEqual({ pix: 1100, cash: 300, debit: 200, credit: 5000, boleto: 400 });
  });

  it("leaves unknown methods out instead of guessing", () => {
    expect(paymentBucket("")).toBeNull();
    expect(paymentBucket("permuta")).toBeNull();
  });
});
