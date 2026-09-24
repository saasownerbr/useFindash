"use client";

import { useEffect, useState } from "react";

import { CalculatorSettings } from "@/components/inputs/calculator-settings";
import { PriceReferenceList } from "@/components/inputs/price-reference-list";
import { PageContainer } from "@/components/ui/page-container";
import { getClientStoreId } from "@/lib/supabase/client-store";

export default function InputsPage() {
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

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Inputs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preços de referência e parâmetros que alimentam a precificação e a Calculadora de Seminovo.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 2xl:grid-cols-2">
        <PriceReferenceList storeId={storeId} />
        <CalculatorSettings storeId={storeId} />
      </div>
    </PageContainer>
  );
}
