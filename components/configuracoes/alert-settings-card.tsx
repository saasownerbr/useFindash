"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { SettingsCard } from "@/components/configuracoes/settings-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import { alertSettingsSchema, type AlertSettingsInput } from "@/lib/validation/store-settings";

export function AlertSettingsCard({ storeId }: { storeId: string | null }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AlertSettingsInput>({
    resolver: zodResolver(alertSettingsSchema),
    defaultValues: { stock_alert_days: 30, upgrade_alert_months: 20 },
  });

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    createClient()
      .from("stores")
      .select("stock_alert_days, upgrade_alert_months")
      .eq("id", storeId)
      .single()
      .then(({ data }) => {
        if (!cancelled && data) reset(data);
      });
    return () => {
      cancelled = true;
    };
  }, [storeId, reset]);

  async function onSubmit(data: AlertSettingsInput) {
    if (!storeId) return;
    const { error } = await createClient().from("stores").update(data).eq("id", storeId);
    if (error) toast.error("Não foi possível salvar. Só donos e administradores podem alterar os alertas.");
    else toast.success("Alertas salvos");
  }

  return (
    <SettingsCard
      title="Alertas Automáticos"
      description="Quando o dashboard avisa sobre estoque parado e clientes prontos para trocar de aparelho."
    >
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="stock-alert-days">Dias para alerta de estoque parado</Label>
          <Input id="stock-alert-days" type="number" inputMode="numeric" min={1} {...register("stock_alert_days")} />
          {errors.stock_alert_days && <span className="text-xs text-danger">{errors.stock_alert_days.message}</span>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="upgrade-alert-months">Meses para janela de upgrade</Label>
          <Input
            id="upgrade-alert-months"
            type="number"
            inputMode="numeric"
            min={1}
            {...register("upgrade_alert_months")}
          />
          {errors.upgrade_alert_months && (
            <span className="text-xs text-danger">{errors.upgrade_alert_months.message}</span>
          )}
        </div>
        <div className="flex justify-end sm:col-span-2">
          <Button type="submit" disabled={isSubmitting || !storeId}>
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </SettingsCard>
  );
}
