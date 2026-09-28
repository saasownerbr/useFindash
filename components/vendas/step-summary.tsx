"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useSaleWizardStore, wizardServiceTotal } from "@/lib/sale-wizard-store";
import { formatCurrencyBRL } from "@/lib/finance";
import { accessoriesTotal, productPrice, splitSaleTotal } from "@/lib/sale-total";
import { partsForStorage, partsTotal, resolveServiceType } from "@/lib/services";
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

  // The total from step 5, split back into the device price, accessory prices and service total the database keeps.
  const serviceFull = wizardServiceTotal(state.service);
  const total = state.saleTotal ?? productPrice(state.product) + accessoriesTotal(state.accessories) + serviceFull;
  const { devicePrice, accessories, service: serviceCharged } = splitSaleTotal(total, state.accessories, serviceFull);
  const revenue = devicePrice + accessoriesTotal(accessories) + serviceCharged;
  const serviceParts = state.service.enabled ? partsTotal(state.service.parts) : 0;
  const accessoriesCost = accessories.reduce((sum, a) => sum + a.quantity * (a.unitCost ?? 0), 0);
  const cmv = (state.product ? state.product.acquisitionCost + state.product.repairCost : 0) + accessoriesCost + serviceParts;
  const margin = revenue - cmv;
  // Commission is on the device leg (sales.sale_price × the seller's rate), as the database records it.
  const estimatedCommission = devicePrice * commissionRate;
  const serviceOnly = state.service.enabled && !state.product && state.accessories.length === 0;

  /** The sale_services row; labor absorbs a discount that reached the service (parts keep their real cost). */
  function serviceRow(saleId: string | null) {
    const parts = partsForStorage(state.service.parts);
    const labor = Math.max(0, Math.round((serviceCharged - partsTotal(parts)) * 100) / 100);
    return {
      store_id: storeId!,
      sale_id: saleId,
      customer_id: state.customer?.id ?? null,
      seller_id: state.sellerId || null,
      device_description: state.service.deviceDescription.trim(),
      service_type: resolveServiceType(state.service.serviceType, state.service.customServiceType),
      parts_replaced: parts,
      labor_cost: labor,
      notes: state.service.notes.trim() || null,
      status: state.service.status,
      // Charged in the sale: the only kind of service that counts as revenue.
      source: "sale",
    };
  }

  function finish(message: string) {
    toast.success(message);
    const customerId = state.customer!.id;
    state.reset();
    router.push(`/clientes/${customerId}`);
  }

  async function handleConfirm() {
    setSubmitError(null);

    if (!storeId || !state.customer) {
      setSubmitError("Selecione um cliente antes de confirmar a venda.");
      return;
    }

    const supabase = createClient();

    // Only a repair, no device or accessory: it is recorded as a service on its own.
    if (serviceOnly) {
      if (serviceCharged <= 0) {
        setSubmitError("Informe o valor das peças ou da mão de obra.");
        return;
      }
      setSubmitting(true);
      const { error } = await supabase.from("sale_services").insert(serviceRow(null));
      setSubmitting(false);
      if (error) {
        const friendly = "Não foi possível registrar a assistência. Tente novamente.";
        setSubmitError(friendly);
        toast.error(friendly);
        return;
      }
      finish("Assistência técnica registrada");
      return;
    }

    const payload = {
      customer_id: state.customer.id,
      seller_id: state.sellerId,
      product_id: state.product?.id ?? null,
      sale_channel: state.saleChannel,
      sale_price: devicePrice,
      payment_method: state.paymentMethod,
      installments: state.installments,
      accessories: accessories.map((a) => ({
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
    const { data: saleId, error } = await supabase.rpc("create_sale", {
      p_store_id: storeId,
      p_customer_id: parsed.data.customer_id,
      p_seller_id: parsed.data.seller_id,
      p_product_id: parsed.data.product_id,
      p_sale_channel: parsed.data.sale_channel,
      p_sale_price: parsed.data.sale_price,
      p_payment_method: parsed.data.payment_method,
      p_installments: parsed.data.installments,
      // Ignored by the database, which reads the costs from the product row.
      p_acquisition_cost: state.product?.acquisitionCost ?? 0,
      p_repair_cost: state.product?.repairCost ?? 0,
      p_accessories: parsed.data.accessories,
    });

    if (error || !saleId) {
      setSubmitting(false);
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

    if (state.service.enabled) {
      const { error: serviceError } = await supabase.from("sale_services").insert(serviceRow(saleId));
      if (serviceError) {
        setSubmitting(false);
        toast.error("Venda registrada, mas a assistência técnica não foi salva. Registre-a em Assistência.");
        const customerId = state.customer.id;
        state.reset();
        router.push(`/clientes/${customerId}`);
        return;
      }
    }

    setSubmitting(false);
    finish(state.service.enabled ? "Venda e assistência registradas com sucesso" : "Venda registrada com sucesso");
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl bg-card shadow-card">
        {state.product && (
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm">
            <span className="text-foreground">
              {state.product.model} · {state.product.storage}
            </span>
            <span className="text-muted-foreground">{formatCurrencyBRL(devicePrice)}</span>
          </div>
        )}
        {accessories.map((item) => (
          <div
            key={item.accessoryId}
            className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm last:border-0"
          >
            <span className="text-foreground">
              {item.quantity}× {item.name}
            </span>
            <span className="text-muted-foreground">{formatCurrencyBRL(item.quantity * item.unitPrice)}</span>
          </div>
        ))}
        {state.service.enabled && (
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm">
            <span className="text-foreground">
              Assistência: {resolveServiceType(state.service.serviceType, state.service.customServiceType)}
            </span>
            <span className="text-muted-foreground">{formatCurrencyBRL(serviceCharged)}</span>
          </div>
        )}
        <div className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-foreground">
          <span>Receita total</span>
          <span>{formatCurrencyBRL(revenue)}</span>
        </div>
      </div>

      {serviceOnly && (
        <p className="text-xs text-muted-foreground">
          Sem aparelho ou acessório: será registrada apenas a assistência técnica, que aparece no menu Assistência.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
