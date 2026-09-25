import { daysInStock, daysUntilBirthday, isInUpgradeWindow, monthsSince } from "@/lib/customer-alerts";

export type UrgentCustomer = { id: string; name: string; whatsapp: string; birthdate: string | null; ltv: number };
export type UrgentSale = {
  customer_id: string;
  sold_at: string;
  product_id: string | null;
  products: { model: string; storage: string } | null;
};

export interface BirthdayAction {
  customer: UrgentCustomer;
  daysLeft: number;
  device: { model: string; storage: string } | null;
}

export interface UpgradeAction {
  customer: UrgentCustomer;
  monthsUsing: number;
  lastDeviceSaleAt: string;
  device: { model: string; storage: string } | null;
  averageTicket: number;
}

export type UrgentTab = "birthday" | "upgrade";

/**
 * The two lists of the "Ações Urgentes" block in Clientes: birthdays in the next 7 days (closest first) and
 * customers whose latest iPhone is older than the store's upgrade window (oldest first). Same rules as the
 * dashboard alert counts, so the numbers match.
 */
export function buildUrgentActions(
  customers: UrgentCustomer[],
  sales: UrgentSale[],
  upgradeAlertMonths: number,
  now: Date = new Date()
): { birthdays: BirthdayAction[]; upgrades: UpgradeAction[] } {
  const lastDeviceSale = new Map<string, UrgentSale>();
  const salesCount = new Map<string, number>();
  for (const sale of sales) {
    salesCount.set(sale.customer_id, (salesCount.get(sale.customer_id) ?? 0) + 1);
    if (!sale.product_id) continue;
    const current = lastDeviceSale.get(sale.customer_id);
    if (!current || sale.sold_at > current.sold_at) lastDeviceSale.set(sale.customer_id, sale);
  }

  const birthdays = customers
    .filter((c) => !!c.birthdate)
    .map((customer) => ({
      customer,
      daysLeft: daysUntilBirthday(customer.birthdate!, now),
      device: lastDeviceSale.get(customer.id)?.products ?? null,
    }))
    .filter((row) => row.daysLeft >= 0 && row.daysLeft <= 7)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const upgrades = customers
    .flatMap((customer) => {
      const sale = lastDeviceSale.get(customer.id);
      if (!sale || !isInUpgradeWindow(sale.sold_at, upgradeAlertMonths, now)) return [];
      const count = salesCount.get(customer.id) ?? 0;
      return [
        {
          customer,
          monthsUsing: monthsSince(sale.sold_at, now),
          lastDeviceSaleAt: sale.sold_at,
          device: sale.products,
          averageTicket: count > 0 ? Number(customer.ltv) / count : 0,
        },
      ];
    })
    .sort((a, b) => (a.lastDeviceSaleAt < b.lastDeviceSaleAt ? -1 : 1));

  return { birthdays, upgrades };
}

/**
 * Where the block opens: a dashboard link (?filter=birthday|upgrade) opens it expanded on that tab; otherwise
 * it follows what the seller left it as last time, collapsed by default.
 */
export function initialUrgentState(
  filter: string | null,
  stored: { expanded?: boolean; tab?: UrgentTab } | null
): { expanded: boolean; tab: UrgentTab } {
  if (filter === "birthday" || filter === "upgrade") return { expanded: true, tab: filter };
  return { expanded: stored?.expanded ?? false, tab: stored?.tab === "upgrade" ? "upgrade" : "birthday" };
}

/** Days a device has been in stock, from its purchase date (the cron-updated column is a day behind at worst). */
export function stockDays(product: { purchase_date: string | null; days_in_stock: number }, now: Date = new Date()): number {
  return product.purchase_date ? daysInStock(product.purchase_date, now) : product.days_in_stock;
}
