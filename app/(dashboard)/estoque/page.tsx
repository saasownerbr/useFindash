"use client";

import { useEffect, useState } from "react";

import { AccessoryList } from "@/components/estoque/accessory-list";
import { ProductList } from "@/components/estoque/product-list";
import { StockAlerts } from "@/components/estoque/stock-alerts";
import { XiaomiForm } from "@/components/estoque/xiaomi-form";
import { Card } from "@/components/ui/card";
import { PageContainer } from "@/components/ui/page-container";
import { TabBar } from "@/components/ui/tab-bar";
import { getClientStoreId } from "@/lib/supabase/client-store";

const TABS = [
  { key: "aparelhos", label: "Aparelhos" },
  { key: "acessorios", label: "Acessórios" },
  { key: "xiaomi", label: "Xiaomi" },
  { key: "alertas", label: "Alertas" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function EstoquePage() {
  const [tab, setTab] = useState<TabKey>("aparelhos");
  const [storeId, setStoreId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getClientStoreId().then((id) => {
      if (!cancelled) setStoreId(id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
      <p className="mt-1 text-[13px] text-muted-foreground">Gerencie aparelhos, acessórios, Xiaomi e alertas da loja.</p>

      <TabBar className="mt-6" tabs={TABS} value={tab} onChange={setTab} />

      <div className="mt-6">
        {tab === "aparelhos" && <ProductList />}
        {tab === "acessorios" && <AccessoryList />}
        {tab === "xiaomi" && (
          <Card className="max-w-3xl p-4 md:p-5">
            <h2 className="text-[15px] font-semibold text-foreground">Entrada de Xiaomi</h2>
            <p className="mb-4 mt-1 text-[13px] text-muted-foreground">
              As unidades entram no estoque geral e aparecem em Aparelhos com a marca Xiaomi.
            </p>
            <XiaomiForm storeId={storeId} />
          </Card>
        )}
        {tab === "alertas" && <StockAlerts />}
      </div>
      </div>
    </PageContainer>
  );
}
