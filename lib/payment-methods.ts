/**
 * Payment options in the sale wizard. `value` is what sales.payment_method stores; the dashboard's payment chart
 * sorts sales by looking for "pix", "débito" and "crédito" in it.
 */
export const PAYMENT_METHODS = [
  { value: "Pix", label: "PIX", installments: "none" },
  { value: "Dinheiro", label: "Dinheiro", installments: "none" },
  { value: "Cartão de débito", label: "Cartão de Débito", installments: "cash" },
  { value: "Cartão de crédito", label: "Cartão de Crédito", installments: "choose" },
  { value: "Boleto", label: "Boleto", installments: "none" },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Credit card sales split into 1 to 24 installments; every other method is a single payment. */
export const MAX_INSTALLMENTS = 24;

export function findPaymentMethod(value: string): PaymentMethod | undefined {
  return PAYMENT_METHODS.find((m) => m.value === value);
}

export type PaymentBreakdown = { pix: number; cash: number; debit: number; credit: number; boleto: number };
export const PAYMENT_BREAKDOWN_KEYS = ["pix", "cash", "debit", "credit", "boleto"] as const;

/** Which bucket a stored payment_method falls in; matches old spellings ("Cartão de Crédito", "credit") too. */
export function paymentBucket(method: string | null | undefined): keyof PaymentBreakdown | null {
  const value = (method ?? "").toLowerCase();
  if (value.includes("pix")) return "pix";
  if (value.includes("dinheiro") || value.includes("cash")) return "cash";
  if (value.includes("débito") || value.includes("debito") || value.includes("debit")) return "debit";
  if (value.includes("crédito") || value.includes("credito") || value.includes("credit")) return "credit";
  if (value.includes("boleto")) return "boleto";
  return null;
}

/** Revenue per payment method, device and accessories together. */
export function paymentBreakdown(
  sales: {
    payment_method: string | null;
    sale_price: number;
    sale_accessories?: { quantity: number; unit_price: number }[] | null;
  }[]
): PaymentBreakdown {
  const totals: PaymentBreakdown = { pix: 0, cash: 0, debit: 0, credit: 0, boleto: 0 };
  for (const sale of sales) {
    const bucket = paymentBucket(sale.payment_method);
    if (!bucket) continue;
    const accessories = (sale.sale_accessories ?? []).reduce((sum, a) => sum + a.quantity * Number(a.unit_price), 0);
    totals[bucket] += Number(sale.sale_price) + accessories;
  }
  return totals;
}
