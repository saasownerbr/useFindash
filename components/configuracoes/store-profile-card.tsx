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
import { formatCpfCnpj } from "@/lib/validation/cnpj";
import { storeProfileSchema, type StoreProfileInput } from "@/lib/validation/store-settings";

export function StoreProfileCard({ storeId }: { storeId: string | null }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StoreProfileInput>({
    resolver: zodResolver(storeProfileSchema),
    defaultValues: { name: "", cnpj: "" },
  });

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    createClient()
      .from("stores")
      .select("name, cnpj")
      .eq("id", storeId)
      .single()
      .then(({ data }) => {
        if (!cancelled && data) reset({ name: data.name, cnpj: formatCpfCnpj(data.cnpj) });
      });
    return () => {
      cancelled = true;
    };
  }, [storeId, reset]);

  async function onSubmit(data: StoreProfileInput) {
    if (!storeId) return;
    const { error } = await createClient()
      .from("stores")
      .update({ name: data.name, cnpj: data.cnpj ?? null })
      .eq("id", storeId);
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
          <Label htmlFor="store-cnpj">CPF ou CNPJ</Label>
          <Input id="store-cnpj" inputMode="numeric" placeholder="Digite o CPF ou o CNPJ" {...register("cnpj")} />
          {errors.cnpj ? (
            <span className="text-xs text-danger">{errors.cnpj.message}</span>
          ) : (
            <span className="text-xs text-[#808080]">Usado na cobrança da assinatura.</span>
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
