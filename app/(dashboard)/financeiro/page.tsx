"use client";

import { useEffect, useState } from "react";

import { CostEntryForm } from "@/components/financeiro/cost-entry-form";
import { CostEntryList } from "@/components/financeiro/cost-entry-list";
import { DrePanel } from "@/components/financeiro/dre-panel";
import { MonthlyInputForm } from "@/components/financeiro/monthly-input-form";
import { RevenueGoalPanel } from "@/components/financeiro/revenue-goal-panel";
import { PeriodSelector } from "@/components/period-selector";
import { PageContainer } from "@/components/ui/page-container";
import { TabBar } from "@/components/ui/tab-bar";
import { getClientStoreId } from "@/lib/supabase/client-store";

const TABS = [
  { key: "dre", label: "DRE" },
  { key: "lancamentos", label: "Lançamentos" },
  { key: "meta", label: "Meta" },
  { key: "trafego", label: "Tráfego e leads" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function FinanceiroPage() {
  const [tab, setTab] = useState<TabKey>("dre");
  const [storeId, setStoreId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // /financeiro?tab=trafego comes from the dashboard's CAC card.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    const match = TABS.find((t) => t.key === requested);
    if (match) setTab(match.key);
  }, []);

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
        <h1 className="text-[22px] font-bold text-foreground">Financeiro</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">DRE, lançamentos, tráfego pago e meta de faturamento.</p>

      <TabBar className="mt-6" tabs={TABS} value={tab} onChange={setTab} />

      <div className="mt-6">
        {tab === "dre" && <DrePanel storeId={storeId} />}
        {tab === "lancamentos" && (
          <div className="space-y-6">
            <PeriodSelector />
            <CostEntryForm storeId={storeId} onSaved={() => setReloadKey((k) => k + 1)} />
            <CostEntryList storeId={storeId} reloadKey={reloadKey} />
          </div>
        )}
        {tab === "trafego" && <MonthlyInputForm storeId={storeId} />}
        {tab === "meta" && <RevenueGoalPanel storeId={storeId} />}
      </div>
      </div>
    </PageContainer>
  );
}
