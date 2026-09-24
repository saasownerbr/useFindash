export function calculateCMV(sales: { acquisition_cost: number; repair_cost: number }[]): number {
  return sales.reduce((sum, s) => sum + Number(s.acquisition_cost) + Number(s.repair_cost), 0);
}

export function calculateGrossMargin(sales: { gross_margin: number | null }[]): number {
  return sales.reduce((sum, s) => sum + Number(s.gross_margin ?? 0), 0);
}

export function calculateNetMargin(
  grossMargin: number,
  costEntries: { amount: number }[],
  commissions: number
): number {
  const totalCosts = costEntries.reduce((sum, c) => sum + Number(c.amount), 0);
  return grossMargin - totalCosts - commissions;
}

/**
 * Paid-traffic CAC: investment per paid-traffic sale. Months with no such sale
 * recorded fall back to the Instagram + WhatsApp leads the store entered.
 */
export function calculateCAC(paidTrafficInvestment: number, paidTrafficSalesCount: number, paidLeadsCount = 0): number {
  const denominator = paidTrafficSalesCount > 0 ? paidTrafficSalesCount : paidLeadsCount;
  if (denominator <= 0) return 0;
  return paidTrafficInvestment / denominator;
}

export function calculateROAS(paidTrafficRevenue: number, paidTrafficInvestment: number): number {
  if (paidTrafficInvestment <= 0) return 0;
  return paidTrafficRevenue / paidTrafficInvestment;
}

export function calculateRetentionRate(customers: { salesCountInPeriod: number }[]): number {
  if (customers.length === 0) return 0;
  const returning = customers.filter((c) => c.salesCountInPeriod > 1).length;
  return returning / customers.length;
}

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
