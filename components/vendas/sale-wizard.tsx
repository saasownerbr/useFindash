"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { StepAccessories } from "@/components/vendas/step-accessories";
import { StepCustomer } from "@/components/vendas/step-customer";
import { StepDetails } from "@/components/vendas/step-details";
import { StepProduct } from "@/components/vendas/step-product";
import { StepSummary } from "@/components/vendas/step-summary";
import { accessoriesTotal, productPrice } from "@/lib/sale-total";
import { getClientStoreId } from "@/lib/supabase/client-store";
import { useSaleWizardStore } from "@/lib/sale-wizard-store";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: 1, label: "Cliente" },
  { key: 2, label: "Produto" },
  { key: 3, label: "Acessórios" },
  { key: 4, label: "Detalhes" },
  { key: 5, label: "Resumo" },
] as const;

export function SaleWizard() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  const customer = useSaleWizardStore((s) => s.customer);
  const product = useSaleWizardStore((s) => s.product);
  const productSkipped = useSaleWizardStore((s) => s.productSkipped);
  const skipProduct = useSaleWizardStore((s) => s.skipProduct);
  const saleChannel = useSaleWizardStore((s) => s.saleChannel);
  const sellerId = useSaleWizardStore((s) => s.sellerId);
  const paymentMethod = useSaleWizardStore((s) => s.paymentMethod);
  const accessories = useSaleWizardStore((s) => s.accessories);
  const saleTotal = useSaleWizardStore((s) => s.saleTotal);
  const total = saleTotal ?? productPrice(product) + accessoriesTotal(accessories);

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

  const canAdvanceFrom1 = !!customer;
  const canAdvanceFrom2 = true;
  const canAdvanceFrom3 = true;
  const canAdvanceFrom4 = !!saleChannel && !!sellerId && !!paymentMethod && total > 0;

  const canAdvance =
    step === 1 ? canAdvanceFrom1 : step === 2 ? canAdvanceFrom2 : step === 3 ? canAdvanceFrom3 : canAdvanceFrom4;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {STEPS.map((s, index) => (
          <div key={s.key} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                step >= s.key ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"
              )}
            >
              {s.key}
            </div>
            <span
              className={cn(
                "hidden text-sm sm:inline",
                step === s.key ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {s.label}
            </span>
            {index < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-card shadow-card p-4 md:p-5">
        {step === 1 && <StepCustomer storeId={storeId} />}
        {step === 2 && (
          <StepProduct
            storeId={storeId}
            onSkip={() => {
              skipProduct();
              setStep(3);
            }}
          />
        )}
        {step === 3 && <StepAccessories storeId={storeId} />}
        {step === 4 && <StepDetails storeId={storeId} />}
        {step === 5 && <StepSummary storeId={storeId} />}
      </div>

      {step < 5 && (
        <div className="flex justify-between">
          <Button variant="secondary" disabled={step === 1} onClick={() => setStep((s) => (s - 1) as typeof step)}>
            Voltar
          </Button>
          <Button
            disabled={!canAdvance || (step === 2 && !product && !productSkipped)}
            onClick={() => setStep((s) => (s + 1) as typeof step)}
          >
            Avançar
          </Button>
        </div>
      )}
      {step === 5 && (
        <div className="flex justify-start">
          <Button variant="secondary" onClick={() => setStep(4)}>
            Voltar
          </Button>
        </div>
      )}
    </div>
  );
}
