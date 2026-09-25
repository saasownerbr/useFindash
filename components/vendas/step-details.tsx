"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatCurrencyBRL } from "@/lib/finance";
import { MAX_INSTALLMENTS, PAYMENT_METHODS, findPaymentMethod } from "@/lib/payment-methods";
import { accessoriesTotal, productPrice } from "@/lib/sale-total";
import { createClient } from "@/lib/supabase/client";
import { useSaleWizardStore } from "@/lib/sale-wizard-store";
import { sellerDisplayName } from "@/lib/rankings";
import { cn } from "@/lib/utils";
import { SALE_CHANNELS } from "@/lib/validation/sale";
import type { Tables } from "@/lib/supabase/types";

type Seller = Tables<"store_users">;

const CHANNEL_LABELS: Record<(typeof SALE_CHANNELS)[number], string> = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  pdv: "Loja física",
  referral: "Indicação",
  paid_traffic: "Tráfego pago",
};

const PAYMENT_BUTTON =
  "rounded-[10px] border border-[#242424] bg-[#111111] px-4 py-2.5 text-sm font-medium text-[#D0D0D0] transition-colors hover:border-[#2E2E2E]";
const PAYMENT_BUTTON_SELECTED = "border-[#dae878] bg-[rgba(218,232,120,0.08)] text-[#dae878] hover:border-[#dae878]";

export function StepDetails({ storeId }: { storeId: string | null }) {
  const saleChannel = useSaleWizardStore((s) => s.saleChannel);
  const sellerId = useSaleWizardStore((s) => s.sellerId);
  const paymentMethod = useSaleWizardStore((s) => s.paymentMethod);
  const installments = useSaleWizardStore((s) => s.installments);
  const product = useSaleWizardStore((s) => s.product);
  const accessories = useSaleWizardStore((s) => s.accessories);
  const saleTotal = useSaleWizardStore((s) => s.saleTotal);
  const setDetails = useSaleWizardStore((s) => s.setDetails);
  const setSaleTotal = useSaleWizardStore((s) => s.setSaleTotal);

  const [sellers, setSellers] = useState<Seller[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!storeId) return;
      const supabase = createClient();
      const { data } = await supabase.from("store_users").select("*").eq("store_id", storeId).order("name");
      if (!cancelled) setSellers(data ?? []);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const details = { saleChannel, sellerId, paymentMethod, installments };
  const method = findPaymentMethod(paymentMethod);

  // Product from step 2 plus accessories from step 3; the seller can still change it (discount, negotiation).
  const devicePart = productPrice(product);
  const accessoriesPart = accessoriesTotal(accessories);
  const autoTotal = devicePart + accessoriesPart;
  const total = saleTotal ?? autoTotal;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="sale_channel">Canal de origem</Label>
        <Select
          id="sale_channel"
          value={saleChannel}
          onChange={(e) => setDetails({ ...details, saleChannel: e.target.value })}
        >
          <option value="">Selecione</option>
          {SALE_CHANNELS.map((channel) => (
            <option key={channel} value={channel}>
              {CHANNEL_LABELS[channel]}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="seller_id">Vendedor</Label>
        <Select id="seller_id" value={sellerId} onChange={(e) => setDetails({ ...details, sellerId: e.target.value })}>
          <option value="">Selecione</option>
          {sellers.map((seller) => (
            <option key={seller.id} value={seller.id}>
              {sellerDisplayName(seller.name)}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-2 sm:col-span-2">
        <span className="text-sm font-medium text-foreground">Forma de pagamento</span>
        <div role="radiogroup" aria-label="Forma de pagamento" className="flex flex-wrap gap-2">
          {PAYMENT_METHODS.map((option) => {
            const selected = option.value === paymentMethod;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                // Only credit keeps a chosen number of installments; everything else is paid at once.
                onClick={() =>
                  setDetails({
                    ...details,
                    paymentMethod: option.value,
                    installments: option.installments === "choose" ? installments : 1,
                  })
                }
                className={cn(PAYMENT_BUTTON, selected && PAYMENT_BUTTON_SELECTED)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {method?.installments === "choose" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="installments">Parcelas</Label>
          <Select
            id="installments"
            value={installments}
            onChange={(e) => setDetails({ ...details, installments: Number(e.target.value) })}
          >
            {Array.from({ length: MAX_INSTALLMENTS }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n === 1 ? "1x (à vista)" : `${n}x de ${formatCurrencyBRL(total / n)}`}
              </option>
            ))}
          </Select>
        </div>
      )}
      {method?.installments === "cash" && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">Parcelas</span>
          <p className="flex h-[42px] items-center text-sm text-muted-foreground">À vista</p>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="sale_total">Valor da venda (R$)</Label>
        <Input
          id="sale_total"
          type="number"
          min={0}
          step="0.01"
          value={total}
          onChange={(e) => setSaleTotal(e.target.value === "" ? 0 : Number(e.target.value))}
        />
        <p className="text-xs text-muted-foreground">
          Produto: {formatCurrencyBRL(devicePart)} + Acessórios: {formatCurrencyBRL(accessoriesPart)} = Total:{" "}
          {formatCurrencyBRL(autoTotal)}
        </p>
        {saleTotal !== null && saleTotal !== autoTotal && (
          <p className="text-xs text-muted-foreground">
            {saleTotal < autoTotal
              ? `Desconto de ${formatCurrencyBRL(autoTotal - saleTotal)} aplicado.`
              : `Acréscimo de ${formatCurrencyBRL(saleTotal - autoTotal)} aplicado.`}{" "}
            <button type="button" className="text-primary hover:underline" onClick={() => setSaleTotal(null)}>
              Voltar ao valor calculado
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
