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
import { storeProfileSchema, type StoreProfileInput } from "@/lib/validation/store-settings";

export function StoreProfileCard({ storeId }: { storeId: string | null }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StoreProfileInput>({
    resolver: zodResolver(storeProfileSchema),
    defaultValues: { name: "", monthly_revenue_goal: 0 },
  });

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    createClient()
      .from("stores")
      .select("name, monthly_revenue_goal")
      .eq("id", storeId)
      .single()
      .then(({ data }) => {
        if (!cancelled && data) reset(data);
      });
    return () => {
      cancelled = true;
    };
  }, [storeId, reset]);

  async function onSubmit(data: StoreProfileInput) {
    if (!storeId) return;
    const { error } = await createClient().from("stores").update(data).eq("id", storeId);
    if (error) toast.error("Não foi possível salvar. Só donos e administradores podem alterar a loja.");
    else toast.success("Dados da loja salvos");
  }

  return (
    <SettingsCard title="Minha Loja">
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="store-name">Nome da loja</Label>
          <Input id="store-name" {...register("name")} />
          {errors.name && <span className="text-xs text-danger">{errors.name.message}</span>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="store-goal">Meta de faturamento mensal (R$)</Label>
          <Input
            id="store-goal"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            {...register("monthly_revenue_goal")}
          />
          {errors.monthly_revenue_goal && (
            <span className="text-xs text-danger">{errors.monthly_revenue_goal.message}</span>
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
