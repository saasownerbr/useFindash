"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useSaleWizardStore } from "@/lib/sale-wizard-store";
import { formatCurrencyBRL } from "@/lib/finance";
import { toast } from "@/lib/toast";
import { saleSchema } from "@/lib/validation/sale";

export function StepSummary({ storeId }: { storeId: string | null }) {
  const router = useRouter();
  const state = useSaleWizardStore();
  const [commissionRate, setCommissionRate] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadCommission() {
      if (!state.sellerId) {
        setCommissionRate(0);
        return;
      }
      const supabase = createClient();
      const { data } = await supabase
        .from("store_users")
        .select("commission_rate")
        .eq("id", state.sellerId)
        .single();
      if (!cancelled) setCommissionRate(data?.commission_rate ?? 0);
    }
    loadCommission();
    return () => {
      cancelled = true;
    };
  }, [state.sellerId]);

  const accessoriesTotal = state.accessories.reduce((sum, a) => sum + a.quantity * a.unitPrice, 0);
  const revenue = state.salePrice + accessoriesTotal;
  const cmv = state.product ? state.product.acquisitionCost + state.product.repairCost : 0;
  const margin = revenue - cmv;
  const estimatedCommission = state.salePrice * commissionRate;

  async function handleConfirm() {
    setSubmitError(null);

    if (!storeId || !state.customer) {
      setSubmitError("Selecione um cliente antes de confirmar a venda.");
      return;
    }

    const payload = {
      customer_id: state.customer.id,
      seller_id: state.sellerId,
      product_id: state.product?.id ?? null,
      sale_channel: state.saleChannel,
      sale_price: state.salePrice,
      payment_method: state.paymentMethod,
      installments: state.installments,
      accessories: state.accessories.map((a) => ({
        accessory_id: a.accessoryId,
        quantity: a.quantity,
        unit_price: a.unitPrice,
      })),
    };

    const parsed = saleSchema.safeParse(payload);
    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? "Revise os dados da venda.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { data: saleId, error } = await supabase.rpc("create_sale", {
      p_store_id: storeId,
      p_customer_id: parsed.data.customer_id,
      p_seller_id: parsed.data.seller_id,
      p_product_id: parsed.data.product_id,
      p_sale_channel: parsed.data.sale_channel,
      p_sale_price: parsed.data.sale_price,
      p_payment_method: parsed.data.payment_method,
      p_installments: parsed.data.installments,
      p_acquisition_cost: state.product?.acquisitionCost ?? 0,
      p_repair_cost: state.product?.repairCost ?? 0,
      p_accessories: parsed.data.accessories,
    });
    setSubmitting(false);

    if (error || !saleId) {
      const message = error?.message ?? "";
      const friendly = message.includes("insufficient accessory stock")
        ? "Estoque insuficiente para um dos acessórios selecionados. Ajuste as quantidades e tente novamente."
        : message.includes("product is not available")
          ? "Este aparelho não está mais disponível para venda."
          : "Não foi possível registrar a venda. Tente novamente.";
      setSubmitError(friendly);
      toast.error(friendly);
      return;
    }

    toast.success("Venda registrada com sucesso");
    const customerId = state.customer.id;
    state.reset();
    router.push(`/clientes/${customerId}`);
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl bg-card shadow-card">
        {state.product && (
          <div className="flex items-center justify-between border-b border-border px-4 py-3 text-sm">
            <span className="text-foreground">
              {state.product.model} · {state.product.storage}
            </span>
            <span className="text-muted-foreground">{formatCurrencyBRL(state.salePrice)}</span>
          </div>
        )}
        {state.accessories.map((item) => (
          <div
            key={item.accessoryId}
            className="flex items-center justify-between border-b border-border px-4 py-3 text-sm last:border-0"
          >
            <span className="text-foreground">
              {item.quantity}× {item.name}
            </span>
            <span className="text-muted-foreground">{formatCurrencyBRL(item.quantity * item.unitPrice)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-foreground">
          <span>Receita total</span>
          <span>{formatCurrencyBRL(revenue)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-card shadow-card p-4 md:p-5">
          <p className="text-xs text-muted-foreground">CMV</p>
          <p className="text-lg font-semibold text-foreground">{formatCurrencyBRL(cmv)}</p>
        </div>
        <div className="rounded-xl bg-card shadow-card p-4 md:p-5">
          <p className="text-xs text-muted-foreground">Margem</p>
          <p className="text-lg font-semibold text-foreground">{formatCurrencyBRL(margin)}</p>
        </div>
        <div className="rounded-xl bg-card shadow-card p-4 md:p-5">
          <p className="text-xs text-muted-foreground">Comissão estimada</p>
          <p className="text-lg font-semibold text-foreground">{formatCurrencyBRL(estimatedCommission)}</p>
        </div>
      </div>

      {submitError && <p className="text-sm text-danger">{submitError}</p>}

      <Button onClick={handleConfirm} disabled={submitting} className="w-full">
        {submitting ? "Registrando venda..." : "Confirmar venda"}
      </Button>
    </div>
  );
}
