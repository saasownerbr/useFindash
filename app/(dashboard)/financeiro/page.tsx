"use client";

import { useEffect, useState } from "react";

import { CostEntryForm } from "@/components/financeiro/cost-entry-form";
import { CostEntryList } from "@/components/financeiro/cost-entry-list";
import { DrePanel } from "@/components/financeiro/dre-panel";
import { MonthlyInputForm } from "@/components/financeiro/monthly-input-form";
import { RevenueGoalPanel } from "@/components/financeiro/revenue-goal-panel";
import { Label } from "@/components/ui/label";
import { MonthPicker, currentMonthValue } from "@/components/ui/month-picker";
import { PageContainer } from "@/components/ui/page-container";
import { getClientStoreId } from "@/lib/supabase/client-store";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "dre", label: "DRE" },
  { key: "lancamentos", label: "Lançamentos" },
  { key: "trafego", label: "Tráfego e leads" },
  { key: "meta", label: "Meta" },
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
      const activeStoreId = await getClientStoreId();
      if (!cancelled) setStoreId(activeStoreId);
    }
    resolveStore();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageContainer>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
        <p className="mt-1 text-sm text-muted-foreground">DRE mensal, lançamentos, tráfego pago e meta de faturamento.</p>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium text-muted-foreground transition-colors",
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
              <MonthPicker id="lancamentos-month" value={month} onChange={(v) => setMonth(v || currentMonthValue())} />
            </div>
            <CostEntryForm storeId={storeId} onSaved={() => setReloadKey((k) => k + 1)} />
            <CostEntryList storeId={storeId} month={month} reloadKey={reloadKey} />
          </div>
        )}
        {tab === "trafego" && <MonthlyInputForm storeId={storeId} />}
        {tab === "meta" && <RevenueGoalPanel storeId={storeId} />}
      </div>
      </div>
    </PageContainer>
  );
}
