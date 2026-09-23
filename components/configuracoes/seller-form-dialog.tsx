"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import type { Tables } from "@/lib/supabase/types";
import { sellerSchema, type SellerInput } from "@/lib/validation/seller";

type Seller = Tables<"store_users">;

const ROLE_LABELS: Record<SellerInput["role"], string> = {
  owner: "Dono",
  admin: "Administrador",
  seller: "Vendedor",
};

interface SellerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string | null;
  seller: Seller | null;
  onSaved: () => void;
}

const DEFAULT_VALUES: SellerInput = { name: "", email: "", role: "seller", commission_rate: 0 };

export function SellerFormDialog({ open, onOpenChange, storeId, seller, onSaved }: SellerFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SellerInput>({
    resolver: zodResolver(sellerSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) return;
    if (seller) {
      reset({ name: seller.name, email: "", role: seller.role as SellerInput["role"], commission_rate: seller.commission_rate });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [open, seller, reset]);

  async function onSubmit(data: SellerInput) {
    if (!storeId) {
      setError("root", { message: "Não foi possível identificar a loja. Recarregue a página." });
      return;
    }

    if (seller) {
      const supabase = createClient();
      const { error } = await supabase
        .from("store_users")
        .update({ name: data.name, role: data.role, commission_rate: data.commission_rate })
        .eq("id", seller.id);

      if (error) {
        setError("root", { message: "Não foi possível salvar o vendedor." });
        toast.error("Não foi possível salvar o vendedor.");
        return;
      }

      toast.success("Vendedor atualizado com sucesso");
      onOpenChange(false);
      onSaved();
      return;
    }

    if (!data.email) {
      setError("email", { message: "Informe um email válido" });
      return;
    }

    const response = await fetch("/api/sellers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, ...data }),
    });
    const result = await response.json();

    if (!response.ok) {
      setError("root", { message: result.error ?? "Não foi possível convidar o vendedor." });
      toast.error(result.error ?? "Não foi possível convidar o vendedor.");
      return;
    }

    toast.success("Convite enviado para o vendedor");
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{seller ? "Editar vendedor" : "Novo vendedor"}</DialogTitle>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <span className="text-xs text-danger">{errors.name.message}</span>}
          </div>

          {!seller && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <span className="text-xs text-danger">{errors.email.message}</span>}
              <p className="text-xs text-muted-foreground">
                Um convite será enviado por email para que o vendedor defina sua senha.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="role">Papel</Label>
              <Select id="role" {...register("role")}>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="commission_rate">Comissão (fração, ex: 0.05)</Label>
              <Input id="commission_rate" type="number" min={0} max={1} step="0.01" {...register("commission_rate")} />
              {errors.commission_rate && <span className="text-xs text-danger">{errors.commission_rate.message}</span>}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
          {errors.root && <span className="text-xs text-danger">{errors.root.message}</span>}
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { ROLE_LABELS };
