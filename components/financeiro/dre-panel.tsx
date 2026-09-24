"use client";

import { useEffect, useState } from "react";

import { NetMarginCard, RevenueCard } from "@/components/finance-highlight-cards";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MonthPicker, currentMonthValue } from "@/components/ui/month-picker";
import { createClient } from "@/lib/supabase/client";
import { sumAccessorySales } from "@/lib/accessory-sales";
import { buildDRE, type DRE } from "@/lib/dre";
import { formatCurrencyBRL } from "@/lib/finance";

function monthRange(month: string) {
  const start = `${month}-01`;
  const [year, mon] = month.split("-").map(Number);
  const nextMonth = mon === 12 ? `${year + 1}-01` : `${year}-${String(mon + 1).padStart(2, "0")}`;
  return { start, end: `${nextMonth}-01` };
}

export function DrePanel({ storeId }: { storeId: string | null }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [dre, setDre] = useState<DRE | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!storeId) return;
      const { start, end } = monthRange(month);
      const supabase = createClient();

      const [{ data: sales, error: salesError }, { data: costEntries, error: costError }, accessorySales] =
        await Promise.all([
          supabase
            .from("sales")
            .select("id, acquisition_cost, repair_cost, gross_margin, commission_amount")
            .eq("store_id", storeId)
            .gte("sold_at", start)
            .lt("sold_at", end),
          supabase.from("cost_entries").select("type, amount").eq("store_id", storeId).eq("month", start),
          sumAccessorySales(supabase, storeId, start, end),
        ]);

      if (cancelled) return;

      if (salesError || costError) {
        setError("Não foi possível carregar o DRE deste mês.");
        return;
      }

      setError(null);
      setDre(
        buildDRE(
          sales ?? [],
          (costEntries ?? []) as { type: "fixed" | "variable" | "marketing" | "supplier"; amount: number }[],
          accessorySales
        )
      );
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [storeId, month]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="dre-month">Mês</Label>
        <MonthPicker id="dre-month" value={month} onChange={(v) => setMonth(v || currentMonthValue())} />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {!dre ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-card" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-3">
          <RevenueCard label="Receita" value={dre.revenue} />
          <DreLine label="CMV" value={formatCurrencyBRL(dre.cmv)} />
          <DreLine label="Margem bruta" value={`${formatCurrencyBRL(dre.grossMargin)} (${(dre.grossMarginPct * 100).toFixed(1)}%)`} />
          <DreLine label="Custos fixos" value={formatCurrencyBRL(dre.costsByType.fixed)} />
          <DreLine label="Custos variáveis" value={formatCurrencyBRL(dre.costsByType.variable)} />
          <DreLine label="Marketing" value={formatCurrencyBRL(dre.costsByType.marketing)} />
          <DreLine label="Fornecedor" value={formatCurrencyBRL(dre.costsByType.supplier)} />
          <DreLine label="Comissões" value={formatCurrencyBRL(dre.commissions)} />
          <NetMarginCard value={dre.netMargin} />
        </div>
      )}
    </div>
  );
}

function DreLine({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4 md:p-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#808080]">{label}</p>
      <p className="mt-2 text-lg font-bold tabular-nums text-foreground">{value}</p>
    </Card>
  );
}
