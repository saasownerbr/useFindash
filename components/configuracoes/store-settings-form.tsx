"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import { storeSettingsSchema, type StoreSettingsInput } from "@/lib/validation/store-settings";

export function StoreSettingsForm({ storeId }: { storeId: string | null }) {
  const [logoPreview, setLogoPreview] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StoreSettingsInput>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: { name: "", logo_url: "", monthly_revenue_goal: 0, stock_alert_days: 30, upgrade_alert_months: 20 },
  });

  const logoUrl = watch("logo_url");

  useEffect(() => {
    setLogoPreview(logoUrl ?? "");
  }, [logoUrl]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!storeId) return;
      const supabase = createClient();
      const { data } = await supabase.from("stores").select("*").eq("id", storeId).single();
      if (!cancelled && data) {
        reset({
          name: data.name,
          logo_url: data.logo_url ?? "",
          monthly_revenue_goal: data.monthly_revenue_goal,
          stock_alert_days: data.stock_alert_days,
          upgrade_alert_months: data.upgrade_alert_months,
        });
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [storeId, reset]);

  async function onSubmit(data: StoreSettingsInput) {
    if (!storeId) {
      setError("root", { message: "Não foi possível identificar a loja. Recarregue a página." });
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("stores")
      .update({
        name: data.name,
        logo_url: data.logo_url || null,
        monthly_revenue_goal: data.monthly_revenue_goal,
        stock_alert_days: data.stock_alert_days,
        upgrade_alert_months: data.upgrade_alert_months,
      })
      .eq("id", storeId);

    if (error) {
      setError("root", { message: "Não foi possível salvar as configurações da loja." });
      toast.error("Não foi possível salvar as configurações da loja.");
      return;
    }

    toast.success("Configurações salvas com sucesso");
  }

  return (
    <form className="grid max-w-2xl grid-cols-2 gap-4 rounded-lg border border-border bg-card p-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="col-span-2 flex flex-col gap-2">
        <Label htmlFor="name">Nome da loja</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <span className="text-xs text-danger">{errors.name.message}</span>}
      </div>

      <div className="col-span-2 flex flex-col gap-2">
        <Label htmlFor="logo_url">URL do logo (opcional)</Label>
        <Input id="logo_url" placeholder="https://..." {...register("logo_url")} />
        {errors.logo_url && <span className="text-xs text-danger">{errors.logo_url.message}</span>}
        {logoPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoPreview} alt="Prévia do logo" className="mt-2 h-16 w-16 rounded-md border border-border object-contain" />
        )}
      </div>

      <div className="col-span-2 flex flex-col gap-2">
        <Label htmlFor="monthly_revenue_goal">Meta de faturamento mensal (R$)</Label>
        <Input id="monthly_revenue_goal" type="number" min={0} step="0.01" {...register("monthly_revenue_goal")} />
        {errors.monthly_revenue_goal && <span className="text-xs text-danger">{errors.monthly_revenue_goal.message}</span>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="stock_alert_days">Dias em estoque para alerta</Label>
        <Input id="stock_alert_days" type="number" min={1} {...register("stock_alert_days")} />
        {errors.stock_alert_days && <span className="text-xs text-danger">{errors.stock_alert_days.message}</span>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="upgrade_alert_months">Meses para janela de upgrade</Label>
        <Input id="upgrade_alert_months" type="number" min={1} {...register("upgrade_alert_months")} />
        {errors.upgrade_alert_months && <span className="text-xs text-danger">{errors.upgrade_alert_months.message}</span>}
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
