import type { WizardAccessory, WizardProduct } from "@/lib/sale-wizard-store";

/** What the device is offered at: the price set on it, else the suggested one. */
export function productPrice(product: WizardProduct): number {
  return product ? Number(product.finalPrice ?? product.suggestedPrice ?? 0) : 0;
}

export function accessoriesTotal(accessories: Pick<WizardAccessory, "quantity" | "unitPrice">[]): number {
  return accessories.reduce((sum, a) => sum + a.quantity * a.unitPrice, 0);
}

const cents = (value: number) => Math.round(value * 100) / 100;

/**
 * Splits the sale total typed in step 4 back into what the database stores: `sales.sale_price` is the device leg
 * only, and accessories keep their own unit prices. Any discount (or markup) lands on the device; if the total is
 * below the accessories alone, the device goes to 0 and the accessory prices shrink in proportion.
 */
export function splitSaleTotal<A extends Pick<WizardAccessory, "quantity" | "unitPrice">>(
  total: number,
  accessories: A[]
): { devicePrice: number; accessories: A[] } {
  const extras = accessoriesTotal(accessories);
  if (total >= extras) return { devicePrice: cents(total - extras), accessories };
  const ratio = extras > 0 ? Math.max(total, 0) / extras : 0;
  return { devicePrice: 0, accessories: accessories.map((a) => ({ ...a, unitPrice: cents(a.unitPrice * ratio) })) };
}
