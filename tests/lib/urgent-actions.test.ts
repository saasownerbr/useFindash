import { describe, expect, it } from "vitest";

import { buildUrgentActions, initialUrgentState, stockDays, type UrgentCustomer, type UrgentSale } from "@/lib/urgent-actions";

const now = new Date("2026-09-25T12:00:00Z");

function customer(id: string, birthdate: string | null, ltv = 0): UrgentCustomer {
  return { id, name: id, whatsapp: "11987654321", birthdate, ltv };
}

function sale(customerId: string, soldAt: string, _price: number, model: string | null): UrgentSale {
  return {
    customer_id: customerId,
    sold_at: soldAt,
    product_id: model ? `p-${customerId}-${soldAt}` : null,
    products: model ? { model, storage: "128GB" } : null,
  };
}

describe("buildUrgentActions", () => {
  it("lists birthdays in the next 7 days, closest first, with the latest iPhone", () => {
    const { birthdays } = buildUrgentActions(
      [customer("far", "1990-10-05"), customer("today", "1990-09-25"), customer("soon", "1990-09-28"), customer("none", null)],
      [sale("today", "2025-01-01", 5000, "iPhone 15"), sale("today", "2026-01-01", 6000, "iPhone 16")],
      20,
      now
    );
    expect(birthdays.map((b) => [b.customer.id, b.daysLeft])).toEqual([
      ["today", 0],
      ["soon", 3],
    ]);
    expect(birthdays[0].device?.model).toBe("iPhone 16");
  });

  it("lists customers whose latest iPhone passed the window, oldest first, with ticket médio", () => {
    const { upgrades } = buildUrgentActions(
      [customer("recent", null, 5000), customer("old", null, 9000), customer("older", null, 4000), customer("accessory", null, 100)],
      [
        sale("recent", "2026-01-01", 5000, "iPhone 16"),
        sale("old", "2024-12-01", 6000, "iPhone 13"),
        sale("old", "2025-01-10", 3000, null),
        sale("older", "2023-05-01", 4000, "iPhone 12"),
        sale("accessory", "2020-01-01", 100, null),
      ],
      20,
      now
    );
    expect(upgrades.map((u) => u.customer.id)).toEqual(["older", "old"]);
    expect(upgrades[1]).toMatchObject({ monthsUsing: 21, averageTicket: 4500, device: { model: "iPhone 13" } });
  });
});

describe("initialUrgentState", () => {
  it("opens expanded on the dashboard's tab", () => {
    expect(initialUrgentState("upgrade", { expanded: false, tab: "birthday" })).toEqual({ expanded: true, tab: "upgrade" });
    expect(initialUrgentState("birthday", null)).toEqual({ expanded: true, tab: "birthday" });
  });

  it("is collapsed by default and otherwise follows the saved state", () => {
    expect(initialUrgentState(null, null)).toEqual({ expanded: false, tab: "birthday" });
    expect(initialUrgentState(null, { expanded: true, tab: "upgrade" })).toEqual({ expanded: true, tab: "upgrade" });
  });
});

describe("stockDays", () => {
  it("counts from the purchase date, falling back to the stored column", () => {
    expect(stockDays({ purchase_date: "2026-08-26", days_in_stock: 0 }, now)).toBe(30);
    expect(stockDays({ purchase_date: null, days_in_stock: 12 }, now)).toBe(12);
  });
});
