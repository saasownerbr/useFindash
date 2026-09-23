import { calculateCMV, calculateGrossMargin } from "./finance";

export type DRE = {
  revenue: number;
  cmv: number;
  grossMargin: number;
  grossMarginPct: number;
  commissions: number;
  costsByType: { fixed: number; variable: number; marketing: number; supplier: number };
  netMargin: number;
};

type SaleForDRE = {
  acquisition_cost: number;
  repair_cost: number;
  gross_margin: number | null;
  commission_amount: number | null;
};
type CostEntryForDRE = { type: "fixed" | "variable" | "marketing" | "supplier"; amount: number };
type AccessorySalesForDRE = { revenue: number; cost: number };

/**
 * `sales.sale_price`/`gross_margin` only cover the device leg of a sale —
 * accessories sold alongside (or standalone) live in `sale_accessories` and
 * are not reflected in those columns, so their revenue/cost must be passed
 * in separately or an accessory-only sale reports as R$ 0 in the DRE.
 */
export function buildDRE(
  sales: SaleForDRE[],
  costEntries: CostEntryForDRE[],
  accessorySales: AccessorySalesForDRE = { revenue: 0, cost: 0 }
): DRE {
  const deviceCmv = calculateCMV(sales);
  const deviceGrossMargin = calculateGrossMargin(sales);
  const revenue = deviceCmv + deviceGrossMargin + accessorySales.revenue;
  const cmv = deviceCmv + accessorySales.cost;
  const grossMargin = revenue - cmv;
  const commissions = sales.reduce((sum, s) => sum + Number(s.commission_amount ?? 0), 0);
  const costsByType = { fixed: 0, variable: 0, marketing: 0, supplier: 0 };
  for (const entry of costEntries) {
    costsByType[entry.type] += Number(entry.amount);
  }
  const totalCosts = costsByType.fixed + costsByType.variable + costsByType.marketing + costsByType.supplier;
  const netMargin = grossMargin - totalCosts - commissions;
  const grossMarginPct = revenue > 0 ? grossMargin / revenue : 0;
  return { revenue, cmv, grossMargin, grossMarginPct, commissions, costsByType, netMargin };
}
