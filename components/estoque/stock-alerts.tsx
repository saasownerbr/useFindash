"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { MessageCircle } from "lucide-react";

import { AlertSettingsForm } from "@/components/estoque/alert-settings-form";
import { ExpandableRow } from "@/components/ui/row-toggle";
import { createClient } from "@/lib/supabase/client";
import { getClientStoreId } from "@/lib/supabase/client-store";
import { daysUntilBirthday, isInUpgradeWindow, monthsSince } from "@/lib/customer-alerts";
import { formatCurrencyBRL } from "@/lib/finance";
import type { AlertSettingsInput } from "@/lib/validation/store-settings";
import { whatsappLink } from "@/lib/whatsapp";
import { formatPhone } from "@/lib/phone";
import { CustomerPhone } from "@/components/ui/customer-phone";

type Customer = { id: string; name: string; whatsapp: string; birthdate: string | null };
type DeviceSale = { customer_id: string; sold_at: string; products: { model: string } | null };
type Product = {
  id: string;
  model: string;
  storage: string;
  grade: string | null;
  acquisition_cost: number;
  days_in_stock: number;
  suggested_price: number | null;
};

interface RawData {
  customers: Customer[];
  deviceSales: DeviceSale[];
  products: Product[];
}

const DATE = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });
const DAY_MONTH = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });

function WhatsAppButton({ phone, message }: { phone: string; message: string }) {
  const href = whatsappLink(phone, message);
  if (!href) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md bg-[rgba(37,211,102,0.12)] px-2.5 py-1 text-xs font-medium text-[#25D366] hover:bg-[rgba(37,211,102,0.2)]"
    >
      <MessageCircle className="h-3.5 w-3.5" aria-hidden />
      WhatsApp
    </a>
  );
}

function AlertTable({
  title,
  color,
  count,
  headers,
  empty,
  children,
}: {
  title: string;
  color: string;
  count: number;
  headers: string[];
  empty: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#242424] border-l-[3px] bg-[#1A1A1A]" style={{ borderLeftColor: count > 0 ? color : "#242424" }}>
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <h2 className="text-[13px] font-semibold text-foreground">{title}</h2>
        <span className="text-2xl font-bold tabular-nums" style={{ color: count > 0 ? color : "#666666" }}>
          {count}
        </span>
      </div>
      {count === 0 ? (
        <p className="border-t border-[#242424] px-5 py-6 text-center text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="overflow-x-auto border-t border-[#242424]">
          <table className="rtable w-full text-sm md:min-w-[560px]">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                {headers.map((h) => (
                  <th key={h} className="px-5 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{children}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const ROW = "border-t border-[#242424]";
const CELL = "px-5 py-3";

/** "Alertas" tab in Estoque: upgrade window, upcoming birthdays and stale devices, plus their thresholds. */
export function StockAlerts() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AlertSettingsInput | null>(null);
  const [data, setData] = useState<RawData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const id = await getClientStoreId();
      if (!id || cancelled) return;
      setStoreId(id);

      const [storeRes, customersRes, salesRes, productsRes] = await Promise.all([
        supabase.from("stores").select("upgrade_alert_months, stock_alert_days").eq("id", id).single(),
        supabase.from("customers").select("id, name, whatsapp, birthdate").eq("store_id", id).order("name"),
        supabase
          .from("sales")
          .select("customer_id, sold_at, products(model)")
          .eq("store_id", id)
          .not("product_id", "is", null)
          .order("sold_at", { ascending: false }),
        supabase
          .from("products")
          .select("id, model, storage, grade, acquisition_cost, days_in_stock, suggested_price")
          .eq("store_id", id)
          .eq("status", "available")
          .order("days_in_stock", { ascending: false }),
      ]);

      if (cancelled) return;
      if (storeRes.error || customersRes.error || salesRes.error || productsRes.error) {
        setError("Não foi possível carregar os alertas.");
        return;
      }

      setSettings({
        stock_alert_days: storeRes.data.stock_alert_days ?? 30,
        upgrade_alert_months: storeRes.data.upgrade_alert_months ?? 20,
      });
      setData({
        customers: customersRes.data ?? [],
        deviceSales: (salesRes.data ?? []) as DeviceSale[],
        products: productsRes.data ?? [],
      });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const lists = useMemo(() => {
    if (!data || !settings) return null;

    // Sales come newest first, so the first one seen per customer is their latest iPhone.
    const lastDeviceSale = new Map<string, DeviceSale>();
    for (const sale of data.deviceSales) {
      if (!lastDeviceSale.has(sale.customer_id)) lastDeviceSale.set(sale.customer_id, sale);
    }

    const upgrade = data.customers
      .map((customer) => ({ customer, sale: lastDeviceSale.get(customer.id) }))
      .filter(
        (row): row is { customer: Customer; sale: DeviceSale } =>
          !!row.sale && isInUpgradeWindow(row.sale.sold_at, settings.upgrade_alert_months)
      )
      .sort((a, b) => (a.sale.sold_at < b.sale.sold_at ? -1 : 1));

    const birthdays = data.customers
      .filter((c): c is Customer & { birthdate: string } => !!c.birthdate)
      .map((customer) => ({ customer, daysLeft: daysUntilBirthday(customer.birthdate) }))
      .filter((row) => row.daysLeft >= 0 && row.daysLeft <= 7)
      .sort((a, b) => a.daysLeft - b.daysLeft);

    const stale = data.products.filter((p) => p.days_in_stock > settings.stock_alert_days);

    return { upgrade, birthdays, stale };
  }, [data, settings]);

  if (error) return <p className="text-sm text-danger">{error}</p>;

  if (!lists) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-card shadow-card" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AlertTable
        title="Clientes em janela de upgrade"
        color="#F59E0B"
        count={lists.upgrade.length}
        headers={["Cliente", "WhatsApp", "Modelo comprado", "Data da compra", "Meses", ""]}
        empty="Nenhum cliente na janela de upgrade."
      >
        {lists.upgrade.map(({ customer, sale }) => (
          <ExpandableRow key={customer.id} className={ROW}>
            <td className={`rt-key ${CELL} font-medium text-foreground`}>{customer.name}</td>
            <td data-label="WhatsApp" className={`${CELL} text-muted-foreground`}>
              <CustomerPhone phone={customer.whatsapp} name={customer.name} />
            </td>
            <td data-label="Modelo comprado" className={CELL}>{sale.products?.model ?? "—"}</td>
            <td data-label="Data da compra" className={`${CELL} text-muted-foreground`}>{DATE.format(new Date(sale.sold_at))}</td>
            <td data-label="Meses desde a compra" className={`${CELL} tabular-nums`}>{monthsSince(sale.sold_at)}</td>
            <td className={`rt-key ${CELL} text-right`}>
              <WhatsAppButton
                phone={formatPhone(customer.whatsapp)}
                message={`Oi ${customer.name.split(" ")[0]}! Já faz um tempo desde o seu ${sale.products?.model ?? "iPhone"}. Temos ótimas condições para upgrade, quer ver?`}
              />
            </td>
          </ExpandableRow>
        ))}
      </AlertTable>

      <AlertTable
        title="Aniversários nos próximos 7 dias"
        color="#10B981"
        count={lists.birthdays.length}
        headers={["Nome", "WhatsApp", "Aniversário", "Dias restantes", ""]}
        empty="Nenhum aniversário nos próximos 7 dias."
      >
        {lists.birthdays.map(({ customer, daysLeft }) => (
          <ExpandableRow key={customer.id} className={ROW}>
            <td className={`rt-key ${CELL} font-medium text-foreground`}>{customer.name}</td>
            <td data-label="WhatsApp" className={`${CELL} text-muted-foreground`}>
              <CustomerPhone phone={customer.whatsapp} name={customer.name} />
            </td>
            <td data-label="Aniversário" className={CELL}>{DAY_MONTH.format(new Date(customer.birthdate))}</td>
            <td data-label="Dias restantes" className={`${CELL} tabular-nums`}>{daysLeft === 0 ? "Hoje" : daysLeft}</td>
            <td className={`rt-key ${CELL} text-right`}>
              <WhatsAppButton phone={formatPhone(customer.whatsapp)} message={`Feliz aniversário, ${customer.name.split(" ")[0]}!`} />
            </td>
          </ExpandableRow>
        ))}
      </AlertTable>

      <AlertTable
        title="Aparelhos parados no estoque"
        color="#EF4444"
        count={lists.stale.length}
        headers={["Modelo", "Armazenamento", "Grade", "Custo", "Dias parado", "Preço sugerido"]}
        empty="Nenhum aparelho parado no estoque."
      >
        {lists.stale.map((p) => (
          <ExpandableRow key={p.id} className={ROW}>
            <td className={`rt-key ${CELL} font-medium text-foreground`}>{p.model}</td>
            <td data-label="Armazenamento" className={CELL}>{p.storage}</td>
            <td data-label="Grade" className={CELL}>{p.grade ?? "—"}</td>
            <td data-label="Custo" className={`${CELL} tabular-nums`}>{formatCurrencyBRL(Number(p.acquisition_cost))}</td>
            <td className={`rt-key ${CELL} font-semibold tabular-nums text-[#EF4444]`}>{p.days_in_stock} dias</td>
            <td data-label="Preço sugerido" className={`${CELL} tabular-nums`}>
              {p.suggested_price != null ? formatCurrencyBRL(Number(p.suggested_price)) : "—"}
            </td>
          </ExpandableRow>
        ))}
      </AlertTable>

      <AlertSettingsForm storeId={storeId} initial={settings} onSaved={setSettings} />
    </div>
  );
}
