"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MonthPicker } from "@/components/ui/month-picker";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import { monthlyInputSchema, type MonthlyInputInput } from "@/lib/validation/monthly-input";

export function MonthlyInputForm({ storeId }: { storeId: string | null }) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MonthlyInputInput>({
    resolver: zodResolver(monthlyInputSchema),
    defaultValues: {
      month: new Date().toISOString().slice(0, 7),
      paid_traffic_investment: 0,
      leads_instagram: 0,
      leads_whatsapp: 0,
    },
  });

  useEffect(() => {
    let cancelled = false;
    async function loadExisting() {
      if (!storeId) return;
      const currentMonth = new Date().toISOString().slice(0, 7);
      const supabase = createClient();
      const { data } = await supabase
        .from("monthly_inputs")
        .select("*")
        .eq("store_id", storeId)
        .eq("month", `${currentMonth}-01`)
        .maybeSingle();
      if (!cancelled && data) {
        reset({
          month: currentMonth,
          paid_traffic_investment: data.paid_traffic_investment,
          leads_instagram: data.leads_instagram,
          leads_whatsapp: data.leads_whatsapp,
        });
      }
    }
    loadExisting();
    return () => {
      cancelled = true;
    };
  }, [storeId, reset]);

  async function onSubmit(data: MonthlyInputInput) {
    if (!storeId) {
      setError("root", { message: "Não foi possível identificar a loja. Recarregue a página." });
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("monthly_inputs").upsert(
      {
        store_id: storeId,
        month: `${data.month}-01`,
        paid_traffic_investment: data.paid_traffic_investment,
        leads_instagram: data.leads_instagram,
        leads_whatsapp: data.leads_whatsapp,
      },
      { onConflict: "store_id,month" }
    );

    if (error) {
      setError("root", { message: "Não foi possível salvar os dados do mês." });
      toast.error("Não foi possível salvar os dados do mês.");
      return;
    }

    toast.success("Dados do mês salvos com sucesso");
  }

  return (
    <form className="grid max-w-xl grid-cols-2 gap-4 rounded-lg border border-border bg-card p-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="col-span-2 flex flex-col gap-2">
        <Label htmlFor="month">Mês</Label>
        <Controller
          control={control}
          name="month"
          render={({ field }) => <MonthPicker id="month" value={field.value ?? ""} onChange={field.onChange} className="w-full" />}
        />
        {errors.month && <span className="text-xs text-danger">{errors.month.message}</span>}
      </div>
      <div className="col-span-2 flex flex-col gap-2">
        <Label htmlFor="paid_traffic_investment">Investimento em tráfego pago (R$)</Label>
        <Input id="paid_traffic_investment" type="number" min={0} step="0.01" {...register("paid_traffic_investment")} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="leads_instagram">Leads Instagram</Label>
        <Input id="leads_instagram" type="number" min={0} {...register("leads_instagram")} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="leads_whatsapp">Leads WhatsApp</Label>
        <Input id="leads_whatsapp" type="number" min={0} {...register("leads_whatsapp")} />
      </div>
      <div className="col-span-2 flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </div>
      {errors.root && <span className="col-span-2 text-xs text-danger">{errors.root.message}</span>}
    </form>
  );
}
