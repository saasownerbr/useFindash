"use client";

import { useEffect, useState } from "react";

import { CostEntryForm } from "@/components/financeiro/cost-entry-form";
import { CostEntryList } from "@/components/financeiro/cost-entry-list";
import { DrePanel } from "@/components/financeiro/dre-panel";
import { MonthlyInputForm } from "@/components/financeiro/monthly-input-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { getActiveStoreId } from "@/lib/supabase/store";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "dre", label: "DRE" },
  { key: "lancamentos", label: "Lançamentos" },
  { key: "trafego", label: "Tráfego e leads" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function FinanceiroPage() {
  const [tab, setTab] = useState<TabKey>("dre");
  const [storeId, setStoreId] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function resolveStore() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const activeStoreId = await getActiveStoreId(supabase, user.id);
      if (!cancelled) setStoreId(activeStoreId);
    }
    resolveStore();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
      <p className="mt-1 text-sm text-muted-foreground">DRE mensal, lançamentos de custos e dados de tráfego pago.</p>

      <div className="mt-6 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium text-muted-foreground transition-colors",
              tab === t.key && "border-b-2 border-primary text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "dre" && <DrePanel storeId={storeId} />}
        {tab === "lancamentos" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="lancamentos-month">Mês</Label>
              <Input
                id="lancamentos-month"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-48"
              />
            </div>
            <CostEntryForm storeId={storeId} onSaved={() => setReloadKey((k) => k + 1)} />
            <CostEntryList storeId={storeId} month={month} reloadKey={reloadKey} />
          </div>
        )}
        {tab === "trafego" && <MonthlyInputForm storeId={storeId} />}
      </div>
    </div>
  );
}
