"use client";

import { useState } from "react";

import { AccessoryList } from "@/components/estoque/accessory-list";
import { ProductList } from "@/components/estoque/product-list";
import { StockAlerts } from "@/components/estoque/stock-alerts";
import { PageContainer } from "@/components/ui/page-container";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "aparelhos", label: "Aparelhos" },
  { key: "acessorios", label: "Acessórios" },
  { key: "alertas", label: "Alertas" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function EstoquePage() {
  const [tab, setTab] = useState<TabKey>("aparelhos");

  return (
    <PageContainer>
      <div>
      <h1 className="text-2xl font-bold text-foreground">Estoque</h1>
      <p className="mt-1 text-sm text-muted-foreground">Gerencie aparelhos, acessórios e alertas da loja.</p>

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
        {tab === "aparelhos" && <ProductList />}
        {tab === "acessorios" && <AccessoryList />}
        {tab === "alertas" && <StockAlerts onShowDevices={() => setTab("aparelhos")} />}
      </div>
      </div>
    </PageContainer>
  );
}
