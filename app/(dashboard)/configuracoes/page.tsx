"use client";

import { useEffect, useState } from "react";

import { CalculatorSettings } from "@/components/configuracoes/calculator-settings";
import { PriceReferenceList } from "@/components/configuracoes/price-reference-list";
import { SellerList } from "@/components/configuracoes/seller-list";
import { SupportForm } from "@/components/configuracoes/support-form";
import { StoreSettingsForm } from "@/components/configuracoes/store-settings-form";
import { PageContainer } from "@/components/ui/page-container";
import { createClient } from "@/lib/supabase/client";
import { getActiveStoreId } from "@/lib/supabase/store";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "loja", label: "Loja" },
  { key: "vendedores", label: "Vendedores" },
  { key: "precos", label: "Tabela de preços" },
  { key: "calculadora", label: "Calculadora" },
  { key: "suporte", label: "Suporte" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ConfiguracoesPage() {
  const [tab, setTab] = useState<TabKey>("loja");
  const [storeId, setStoreId] = useState<string | null>(null);

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
    <PageContainer>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Dados da loja, vendedores, tabela de preços e alertas.</p>

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
        {tab === "loja" && <StoreSettingsForm storeId={storeId} />}
        {tab === "vendedores" && <SellerList storeId={storeId} />}
        {tab === "precos" && <PriceReferenceList storeId={storeId} />}
        {tab === "calculadora" && <CalculatorSettings storeId={storeId} />}
        {tab === "suporte" && <SupportForm />}
      </div>
      </div>
    </PageContainer>
  );
}
