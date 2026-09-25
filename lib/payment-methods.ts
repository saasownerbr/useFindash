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
