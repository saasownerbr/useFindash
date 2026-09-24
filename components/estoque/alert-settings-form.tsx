"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import { alertSettingsSchema, type AlertSettingsInput } from "@/lib/validation/store-settings";

/** Alert thresholds, edited under the alert cards in Estoque › Alertas. */
export function AlertSettingsForm({
  storeId,
  initial,
  onSaved,
}: {
  storeId: string | null;
  initial: AlertSettingsInput | null;
  onSaved: (values: AlertSettingsInput) => void;
}) {
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
    if (initial) reset(initial);
  }, [initial, reset]);

  async function onSubmit(data: AlertSettingsInput) {
    if (!storeId) return;
    const { error } = await createClient().from("stores").update(data).eq("id", storeId);
    if (error) {
      toast.error("Não foi possível salvar. Só donos e administradores podem alterar os alertas.");
      return;
    }
    toast.success("Alertas salvos");
    onSaved(data);
  }

  return (
    <section className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
      <h2 className="text-base font-semibold text-foreground">Configuração dos alertas</h2>
      <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="stock-alert-days">Alertar aparelhos parados após X dias</Label>
          <Input id="stock-alert-days" type="number" inputMode="numeric" min={1} {...register("stock_alert_days")} />
          {errors.stock_alert_days && <span className="text-xs text-danger">{errors.stock_alert_days.message}</span>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="upgrade-alert-months">Alertar clientes para upgrade após X meses</Label>
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
    </section>
  );
}
