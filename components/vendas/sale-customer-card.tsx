"use client";

import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChannelBadge } from "@/components/ui/channel-badge";
import { formatCurrencyBRL } from "@/lib/finance";
import { createClient } from "@/lib/supabase/client";
import { useSaleWizardStore } from "@/lib/sale-wizard-store";

interface CustomerExtra {
  ltv: number;
  acquisitionChannel: string | null;
  purchases: number;
}

/** Right-hand block of Nova venda: who is buying and what the sale holds so far. */
export function SaleCustomerCard({ storeId, onChangeCustomer }: { storeId: string | null; onChangeCustomer: () => void }) {
  const customer = useSaleWizardStore((s) => s.customer);
  const product = useSaleWizardStore((s) => s.product);
  const productSkipped = useSaleWizardStore((s) => s.productSkipped);
  const accessories = useSaleWizardStore((s) => s.accessories);
  const salePrice = useSaleWizardStore((s) => s.salePrice);
  const [extra, setExtra] = useState<CustomerExtra | null>(null);

  useEffect(() => {
    setExtra(null);
    if (!storeId || !customer) return;
    let cancelled = false;
    const supabase = createClient();
    Promise.all([
      supabase.from("customers").select("ltv, acquisition_channel").eq("id", customer.id).eq("store_id", storeId).maybeSingle(),
      supabase.from("sales").select("id", { count: "exact", head: true }).eq("customer_id", customer.id).eq("store_id", storeId),
    ]).then(([customerRes, salesRes]) => {
      if (cancelled || !customerRes.data) return;
      setExtra({
        ltv: Number(customerRes.data.ltv),
        acquisitionChannel: customerRes.data.acquisition_channel,
        purchases: salesRes.count ?? 0,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [storeId, customer]);

  const accessoriesTotal = accessories.reduce((sum, a) => sum + a.quantity * a.unitPrice, 0);
  const total = (product ? salePrice : 0) + accessoriesTotal;

  return (
    <aside className="space-y-4 lg:sticky lg:top-6">
      <section className="rounded-xl border border-[#2A2A2A] bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cliente</p>
        {customer ? (
          <>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                {customer.name.trim().charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{customer.name}</p>
                <p className="text-sm text-muted-foreground">{customer.whatsapp}</p>
              </div>
            </div>
            {extra ? (
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">LTV</dt>
                  <dd className="font-semibold text-foreground">{formatCurrencyBRL(extra.ltv)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Compras</dt>
                  <dd className="font-semibold text-foreground">{extra.purchases}</dd>
                </div>
                {extra.acquisitionChannel && (
                  <div className="col-span-2">
                    <dt className="mb-1 text-xs text-muted-foreground">Canal de aquisição</dt>
                    <dd>
                      <ChannelBadge channel={extra.acquisitionChannel} />
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <div className="mt-4 h-12 animate-pulse rounded-md bg-secondary/40" />
            )}
            <Button variant="secondary" className="mt-4 w-full" onClick={onChangeCustomer}>
              Trocar cliente
            </Button>
          </>
        ) : (
          <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
            <UserRound className="h-5 w-5 shrink-0" aria-hidden />
            Nenhum cliente selecionado ainda.
          </div>
        )}
      </section>

      <section className="rounded-xl border border-[#2A2A2A] bg-card p-5 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Venda</p>
        <div className="mt-3 space-y-2">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Aparelho</span>
            <span className="truncate text-right text-foreground">
              {product ? `${product.model} · ${product.storage}` : productSkipped ? "Sem aparelho" : "—"}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Acessórios</span>
            <span className="text-foreground">
              {accessories.length > 0 ? `${accessories.reduce((n, a) => n + a.quantity, 0)} itens` : "—"}
            </span>
          </div>
          <div className="flex justify-between gap-3 border-t border-border pt-2 font-semibold">
            <span className="text-foreground">Total</span>
            <span className="tabular-nums text-foreground">{formatCurrencyBRL(total)}</span>
          </div>
        </div>
      </section>
    </aside>
  );
}
