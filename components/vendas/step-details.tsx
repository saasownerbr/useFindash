"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useSaleWizardStore } from "@/lib/sale-wizard-store";
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

export function StepDetails({ storeId }: { storeId: string | null }) {
  const saleChannel = useSaleWizardStore((s) => s.saleChannel);
  const sellerId = useSaleWizardStore((s) => s.sellerId);
  const paymentMethod = useSaleWizardStore((s) => s.paymentMethod);
  const installments = useSaleWizardStore((s) => s.installments);
  const salePrice = useSaleWizardStore((s) => s.salePrice);
  const setDetails = useSaleWizardStore((s) => s.setDetails);
  const setSalePrice = useSaleWizardStore((s) => s.setSalePrice);

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

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="sale_channel">Canal de origem</Label>
        <Select
          id="sale_channel"
          value={saleChannel}
          onChange={(e) => setDetails({ saleChannel: e.target.value, sellerId, paymentMethod, installments })}
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
        <Select
          id="seller_id"
          value={sellerId}
          onChange={(e) => setDetails({ saleChannel, sellerId: e.target.value, paymentMethod, installments })}
        >
          <option value="">Selecione</option>
          {sellers.map((seller) => (
            <option key={seller.id} value={seller.id}>
              {seller.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="payment_method">Forma de pagamento</Label>
        <Input
          id="payment_method"
          placeholder="Pix, cartão, dinheiro..."
          value={paymentMethod}
          onChange={(e) => setDetails({ saleChannel, sellerId, paymentMethod: e.target.value, installments })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="installments">Parcelas</Label>
        <Input
          id="installments"
          type="number"
          min={1}
          value={installments}
          onChange={(e) =>
            setDetails({ saleChannel, sellerId, paymentMethod, installments: Number(e.target.value) || 1 })
          }
        />
      </div>

      <div className="col-span-2 flex flex-col gap-2">
        <Label htmlFor="sale_price">Valor da venda (R$)</Label>
        <Input
          id="sale_price"
          type="number"
          min={0}
          step="0.01"
          value={salePrice}
          onChange={(e) => setSalePrice(Number(e.target.value) || 0)}
        />
      </div>
    </div>
  );
}
