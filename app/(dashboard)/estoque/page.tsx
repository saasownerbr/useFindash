"use client";

import { useEffect, useState } from "react";

import { AccessoryList } from "@/components/estoque/accessory-list";
import { ProductList } from "@/components/estoque/product-list";
import { StockAlerts } from "@/components/estoque/stock-alerts";
import { PageContainer } from "@/components/ui/page-container";
import { TabBar } from "@/components/ui/tab-bar";

const TABS = [
  { key: "aparelhos", label: "Aparelhos" },
  { key: "acessorios", label: "Acessórios" },
  { key: "alertas", label: "Alertas" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function EstoquePage() {
  const [tab, setTab] = useState<TabKey>("aparelhos");

  // /estoque?tab=alertas comes from the dashboard alert cards.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    const match = TABS.find((t) => t.key === requested);
    if (match) setTab(match.key);
  }, []);

  return (
    <PageContainer>
      <div>
      <h1 className="text-[22px] font-bold text-foreground">Estoque</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">Gerencie aparelhos, acessórios e alertas da loja.</p>

      <TabBar className="mt-6" tabs={TABS} value={tab} onChange={setTab} />

      <div className="mt-6">
        {tab === "aparelhos" && <ProductList />}
        {tab === "acessorios" && <AccessoryList />}
        {tab === "alertas" && <StockAlerts />}
      </div>
      </div>
    </PageContainer>
  );
}
