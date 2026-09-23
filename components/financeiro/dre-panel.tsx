"use client";

import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
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

      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select("acquisition_cost, repair_cost, gross_margin, commission_amount")
        .eq("store_id", storeId)
        .gte("sold_at", start)
        .lt("sold_at", end);

      const { data: costEntries, error: costError } = await supabase
        .from("cost_entries")
        .select("type, amount")
        .eq("store_id", storeId)
        .eq("month", start);

      if (cancelled) return;

      if (salesError || costError) {
        setError("Não foi possível carregar o DRE deste mês.");
        return;
      }

      setError(null);
      setDre(
        buildDRE(
          sales ?? [],
          (costEntries ?? []) as { type: "fixed" | "variable" | "marketing" | "supplier"; amount: number }[]
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
        <Input id="dre-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-48" />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {!dre ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-card" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <DreLine label="Receita" value={formatCurrencyBRL(dre.revenue)} />
          <DreLine label="CMV" value={formatCurrencyBRL(dre.cmv)} />
          <DreLine label="Margem bruta" value={`${formatCurrencyBRL(dre.grossMargin)} (${(dre.grossMarginPct * 100).toFixed(1)}%)`} />
          <DreLine label="Custos fixos" value={formatCurrencyBRL(dre.costsByType.fixed)} />
          <DreLine label="Custos variáveis" value={formatCurrencyBRL(dre.costsByType.variable)} />
          <DreLine label="Marketing" value={formatCurrencyBRL(dre.costsByType.marketing)} />
          <DreLine label="Fornecedor" value={formatCurrencyBRL(dre.costsByType.supplier)} />
          <DreLine label="Comissões" value={formatCurrencyBRL(dre.commissions)} />
          <DreLine label="Margem líquida" value={formatCurrencyBRL(dre.netMargin)} highlight />
        </div>
      )}
    </div>
  );
}

function DreLine({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={highlight ? "text-xl font-bold text-primary" : "text-lg font-semibold text-foreground"}>{value}</p>
      </CardContent>
    </Card>
  );
}
