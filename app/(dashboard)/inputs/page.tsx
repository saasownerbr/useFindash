"use client";

import { useEffect, useState } from "react";

import { UsedDeviceCalculator } from "@/components/calculadora/used-device-calculator";
import { PriceReferenceList } from "@/components/configuracoes/price-reference-list";
import { PageContainer } from "@/components/ui/page-container";
import { getClientStoreId } from "@/lib/supabase/client-store";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "precos", label: "Tabela de Preços" },
  { key: "calculadora", label: "Calculadora de Seminovo" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function isTabKey(value: string | null): value is TabKey {
  return TABS.some((t) => t.key === value);
}

export default function InputsPage() {
  const [tab, setTab] = useState<TabKey>("precos");
  const [storeId, setStoreId] = useState<string | null>(null);

  // /inputs?tab=calculadora (the old /calculadora route redirects here).
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    if (isTabKey(requested)) setTab(requested);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getClientStoreId().then((id) => {
      if (!cancelled) setStoreId(id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageContainer>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inputs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tabela de preços de referência e avaliação de seminovos antes da compra.
        </p>

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
          {tab === "precos" && <PriceReferenceList storeId={storeId} />}
          {tab === "calculadora" && <UsedDeviceCalculator />}
        </div>
      </div>
    </PageContainer>
  );
}
