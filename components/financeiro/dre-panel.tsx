"use client";

import { useEffect, useState } from "react";

import { NetMarginCard, RevenueCard } from "@/components/finance-highlight-cards";
import { PeriodSelector } from "@/components/period-selector";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { sumAccessorySales } from "@/lib/accessory-sales";
import { fetchCostEntries } from "@/lib/cost-entries";
import { buildDRE, periodCosts, type DRE } from "@/lib/dre";
import { calculateAverageTicket, calculateCAC, calculateROAS, formatCurrencyBRL } from "@/lib/finance";
import { firstOfMonth } from "@/lib/period";
import { usePeriodFilterStore } from "@/lib/period-filter-store";


interface DreKpis {
  salesCount: number;
  paidSalesCount: number;
  paidRevenue: number;
  investment: number;
}

export function DrePanel({ storeId }: { storeId: string | null }) {
  const { startDate, endDate } = usePeriodFilterStore();
  const [dre, setDre] = useState<DRE | null>(null);
  const [kpis, setKpis] = useState<DreKpis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!storeId || !startDate || !endDate) return;
      const start = startDate.toISOString();
      const end = endDate.toISOString();
      const supabase = createClient();

      // One parallel round (Supabase is ~300 ms away from Brazil).
      const [salesRes, costsRes, inputsRes, accessorySales] = await Promise.all([
        supabase
          .from("sales")
          .select("id, sale_price, acquisition_cost, repair_cost, gross_margin, commission_amount, sale_channel, sale_accessories(quantity, unit_price)")
          .eq("store_id", storeId)
          .gte("sold_at", start)
          .lte("sold_at", end),
        fetchCostEntries(supabase, storeId, startDate, endDate),
        // Paid traffic is entered per month: every month the period touches counts.
        supabase
          .from("monthly_inputs")
          .select("paid_traffic_investment")
          .eq("store_id", storeId)
          .gte("month", firstOfMonth(startDate))
          .lte("month", firstOfMonth(endDate)),
        sumAccessorySales(supabase, storeId, start, end),
      ]);

      if (cancelled) return;

      if (salesRes.error || costsRes.error) {
        setError("Não foi possível carregar o DRE deste período.");
        return;
      }

      const sales = salesRes.data ?? [];
      const saleRevenue = (s: (typeof sales)[number]) =>
        Number(s.sale_price) + s.sale_accessories.reduce((sum, a) => sum + a.quantity * Number(a.unit_price), 0);
      const paidSales = sales.filter((s) => s.sale_channel === "paid_traffic");

      setError(null);
      setDre(buildDRE(sales, periodCosts(costsRes.entries, startDate, endDate), accessorySales));
      setKpis({
        salesCount: sales.length,
        paidSalesCount: paidSales.length,
        paidRevenue: paidSales.reduce((sum, s) => sum + saleRevenue(s), 0),
        investment: (inputsRes.data ?? []).reduce((sum, row) => sum + Number(row.paid_traffic_investment), 0),
      });
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [storeId, startDate, endDate]);

  return (
    <div className="space-y-6">
      <PeriodSelector />

      {error && <p className="text-sm text-danger">{error}</p>}

      {!dre || !kpis ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-card" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-3">
            <RevenueCard label="Receita" value={dre.revenue} />
            <DreLine label="CMV" value={formatCurrencyBRL(dre.cmv)} />
            <DreLine label="Margem bruta" value={`${formatCurrencyBRL(dre.grossMargin)} (${(dre.grossMarginPct * 100).toFixed(1)}%)`} />
            <DreLine
              label="Custos fixos"
              value={formatCurrencyBRL(dre.costsByType.fixed)}
              note="Proporcional ao período: 1/30 do mês por dia; mês inteiro conta 100%"
            />
            <DreLine label="Custos variáveis" value={formatCurrencyBRL(dre.costsByType.variable)} />
            <DreLine label="Marketing" value={formatCurrencyBRL(dre.costsByType.marketing)} />
            <DreLine
              label="Compras de fornecedor"
              value={formatCurrencyBRL(dre.costsByType.supplier)}
              note="Não entra na margem: o custo do aparelho já conta no CMV quando ele é vendido"
            />
            <DreLine label="Comissões" value={formatCurrencyBRL(dre.commissions)} />
            <NetMarginCard value={dre.netMargin} />
          </div>

          <section className="space-y-3">
            <h2 className="text-[13px] font-semibold text-foreground">Indicadores</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
              <DreLine
                label="Ticket médio"
                value={kpis.salesCount > 0 ? formatCurrencyBRL(calculateAverageTicket(dre.revenue, kpis.salesCount)) : "Sem dados"}
                note={`${kpis.salesCount} ${kpis.salesCount === 1 ? "venda" : "vendas"} no período`}
              />
              <DreLine
                label="CAC Tráfego Pago"
                value={
                  kpis.investment <= 0
                    ? "Sem dados"
                    : kpis.paidSalesCount > 0
                      ? formatCurrencyBRL(calculateCAC(kpis.investment, kpis.paidSalesCount))
                      : "Sem vendas"
                }
                note={
                  kpis.investment > 0
                    ? `${formatCurrencyBRL(kpis.investment)} investidos · ${kpis.paidSalesCount} ${kpis.paidSalesCount === 1 ? "venda" : "vendas"} de tráfego pago`
                    : "Registre o investimento em Tráfego e leads"
                }
              />
              <DreLine
                label="ROAS"
                value={
                  kpis.investment > 0
                    ? `${calculateROAS(kpis.paidRevenue, kpis.investment).toFixed(1)}x`
                    : "Sem dados"
                }
                note={kpis.investment > 0 ? `${formatCurrencyBRL(kpis.paidRevenue)} em vendas de tráfego pago` : "Registre o investimento em Tráfego e leads"}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function DreLine({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card className="p-4 md:p-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#808080]">{label}</p>
      <p className="mt-2 text-lg font-bold tabular-nums text-foreground">{value}</p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </Card>
  );
}
