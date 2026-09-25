import { calculateCMV, calculateGrossMargin } from "./finance";
import { localDay } from "./period";

export type CostType = "fixed" | "variable" | "marketing" | "supplier";
export type CostsByType = Record<CostType, number>;

export type DRE = {
  revenue: number;
  cmv: number;
  grossMargin: number;
  grossMarginPct: number;
  commissions: number;
  costsByType: CostsByType;
  netMargin: number;
};

type SaleForDRE = {
  acquisition_cost: number;
  repair_cost: number;
  gross_margin: number | null;
  commission_amount: number | null;
};
type AccessorySalesForDRE = { revenue: number; cost: number };
export type CostEntryForPeriod = { type: CostType; amount: number; date: string };

export const NO_COSTS: CostsByType = { fixed: 0, variable: 0, marketing: 0, supplier: 0 };

/** Fixed costs are monthly; a partial period carries days/30 of each month it touches. */
const DAYS_PER_MONTH = 30;

/** Day number for a yyyy-mm-dd string, for counting days without DST surprises. */
function dayNumber(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86400000;
}

/**
 * Costs that belong to [start, end], the same way for the dashboard and the DRE:
 * - fixed: each month the period touches contributes (days of the period in that month / 30) of that month's
 *   fixed entries, capped at 100%; a month the period fully covers always counts 100%. "Hoje" is 1/30, "15 dias"
 *   15/30 (split across months when it crosses one), 90 days about three months. `wholeMonths` charges 100% of
 *   every month touched: "Este mês" runs from the 1st to today but carries the whole month, like the monthly DRE.
 * - variable, marketing and supplier: the entries dated inside the period.
 * `entries` must include every entry of the months the period touches (fixed costs are dated anywhere in them).
 */
export function periodCosts(
  entries: CostEntryForPeriod[],
  start: Date,
  end: Date,
  { wholeMonths = false }: { wholeMonths?: boolean } = {}
): CostsByType {
  const startDay = localDay(start);
  const endDay = localDay(end);
  const costs = { ...NO_COSTS };

  const fixedByMonth = new Map<string, number>();
  for (const entry of entries) {
    const amount = Number(entry.amount);
    if (entry.type === "fixed") {
      const month = entry.date.slice(0, 7);
      fixedByMonth.set(month, (fixedByMonth.get(month) ?? 0) + amount);
    } else if (entry.date >= startDay && entry.date <= endDay) {
      costs[entry.type] += amount;
    }
  }

  for (let cursor = new Date(start.getFullYear(), start.getMonth(), 1); cursor <= end; cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)) {
    const monthFixed = fixedByMonth.get(localDay(cursor).slice(0, 7)) ?? 0;
    if (monthFixed === 0) continue;
    const monthFirst = localDay(cursor);
    const monthLast = localDay(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0));
    const from = startDay > monthFirst ? startDay : monthFirst;
    const to = endDay < monthLast ? endDay : monthLast;
    const days = dayNumber(to) - dayNumber(from) + 1;
    const coversMonth = from === monthFirst && to === monthLast;
    const share = wholeMonths || coversMonth ? 1 : Math.min(1, days / DAYS_PER_MONTH);
    costs.fixed += monthFixed * share;
  }

  return costs;
}

/**
 * `sales.sale_price`/`gross_margin` only cover the device leg of a sale —
 * accessories sold alongside (or standalone) live in `sale_accessories` and
 * are not reflected in those columns, so their revenue/cost must be passed
 * in separately or an accessory-only sale reports as R$ 0 in the DRE.
 *
 * CMV is only what the sold items cost (acquisition + repair, plus accessory cost). Supplier entries are stock
 * purchases: that money reaches the result through CMV when the device sells, so it is shown but never
 * subtracted again. Net margin = revenue − CMV − fixed − variable − marketing − commissions.
 */
export function buildDRE(
  sales: SaleForDRE[],
  costs: CostsByType,
  accessorySales: AccessorySalesForDRE = { revenue: 0, cost: 0 }
): DRE {
  const deviceCmv = calculateCMV(sales);
  const deviceGrossMargin = calculateGrossMargin(sales);
  const revenue = deviceCmv + deviceGrossMargin + accessorySales.revenue;
  const cmv = deviceCmv + accessorySales.cost;
  const grossMargin = revenue - cmv;
  const commissions = sales.reduce((sum, s) => sum + Number(s.commission_amount ?? 0), 0);
  const netMargin = grossMargin - costs.fixed - costs.variable - costs.marketing - commissions;
  const grossMarginPct = revenue > 0 ? grossMargin / revenue : 0;
  return { revenue, cmv, grossMargin, grossMarginPct, commissions, costsByType: { ...costs }, netMargin };
}
