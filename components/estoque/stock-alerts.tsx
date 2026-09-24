"use client";

import { useEffect, useState } from "react";

import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { createClient } from "@/lib/supabase/client";
import { getClientStoreId } from "@/lib/supabase/client-store";
import { isBirthdayWithinDays, isInUpgradeWindow } from "@/lib/customer-alerts";
import { formatCurrencyBRL } from "@/lib/finance";

type StaleProduct = {
  id: string;
  model: string;
  storage: string;
  color: string | null;
  days_in_stock: number;
  final_price: number | null;
  suggested_price: number | null;
};

interface AlertData {
  upgradeWindowCount: number;
  birthdaysCount: number;
  staleProducts: StaleProduct[];
  stockAlertDays: number;
}

/** "Alertas" tab in Estoque: the three alert cards plus the devices sitting in stock too long. */
export function StockAlerts({ onShowDevices }: { onShowDevices: () => void }) {
  const [data, setData] = useState<AlertData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const storeId = await getClientStoreId();
      if (!storeId || cancelled) return;

      const [storeRes, customersRes, salesRes, productsRes] = await Promise.all([
        supabase.from("stores").select("upgrade_alert_months, stock_alert_days").eq("id", storeId).single(),
        supabase.from("customers").select("id, birthdate").eq("store_id", storeId),
        supabase.from("sales").select("customer_id, sold_at").eq("store_id", storeId).order("sold_at", { ascending: false }),
        supabase
          .from("products")
          .select("id, model, storage, color, days_in_stock, final_price, suggested_price")
          .eq("store_id", storeId)
          .eq("status", "available")
          .order("days_in_stock", { ascending: false }),
      ]);

      if (cancelled) return;
      if (storeRes.error || customersRes.error || salesRes.error || productsRes.error) {
        setError("Não foi possível carregar os alertas.");
        return;
      }

      // Sales come newest first, so the first one seen per customer is the latest.
      const lastSaleByCustomer = new Map<string, string>();
      for (const sale of salesRes.data ?? []) {
        if (!lastSaleByCustomer.has(sale.customer_id)) lastSaleByCustomer.set(sale.customer_id, sale.sold_at);
      }

      const customers = customersRes.data ?? [];
      const upgradeAlertMonths = storeRes.data?.upgrade_alert_months ?? 20;
      const stockAlertDays = storeRes.data?.stock_alert_days ?? 30;

      setData({
        upgradeWindowCount: customers.filter((c) =>
          isInUpgradeWindow(lastSaleByCustomer.get(c.id) ?? null, upgradeAlertMonths)
        ).length,
        birthdaysCount: customers.filter((c) => isBirthdayWithinDays(c.birthdate, 7)).length,
        staleProducts: (productsRes.data ?? []).filter((p) => p.days_in_stock > stockAlertDays),
        stockAlertDays,
      });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="text-sm text-danger">{error}</p>;

  if (!data) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-card" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AlertsPanel
        upgradeWindowCount={data.upgradeWindowCount}
        birthdaysCount={data.birthdaysCount}
        staleStockCount={data.staleProducts.length}
        onStaleStockClick={onShowDevices}
      />

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Parados há mais de {data.stockAlertDays} dias</h2>
        {data.staleProducts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum aparelho parado no estoque.
          </div>
        ) : (
          <ul className="overflow-hidden rounded-xl border border-border bg-card">
            {data.staleProducts.map((p) => {
              const price = p.final_price ?? p.suggested_price;
              return (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm last:border-0"
                >
                  <span className="min-w-0 truncate font-medium text-foreground">
                    {p.model} · {p.storage}
                    {p.color ? ` · ${p.color}` : ""}
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="text-muted-foreground">{price != null ? formatCurrencyBRL(price) : "Sem preço"}</span>
                    <span className="rounded-md bg-danger/15 px-2 py-0.5 text-xs font-semibold tabular-nums text-danger">
                      {p.days_in_stock} dias
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
