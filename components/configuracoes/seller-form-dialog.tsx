"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { sellerSchema, type SellerInput } from "@/lib/validation/seller";

const ROLE_LABELS: Record<SellerInput["role"], string> = {
  owner: "Dono",
  admin: "Administrador",
  seller: "Vendedor",
};

interface SellerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string | null;
  onSaved: () => void;
}

const DEFAULT_VALUES: SellerInput = { name: "", email: "", role: "seller", commission_rate: 0 };

/** Invites a new seller; existing sellers are edited inline in the list. */
export function SellerFormDialog({ open, onOpenChange, storeId, onSaved }: SellerFormDialogProps) {
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
    if (open) reset(DEFAULT_VALUES);
  }, [open, reset]);

  async function onSubmit(data: SellerInput) {
    if (!storeId) {
      setError("root", { message: "Não foi possível identificar a loja. Recarregue a página." });
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
          <DialogTitle>Adicionar vendedor</DialogTitle>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <span className="text-xs text-danger">{errors.name.message}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <span className="text-xs text-danger">{errors.email.message}</span>}
            <p className="text-xs text-muted-foreground">
              Um convite será enviado por email para que o vendedor defina sua senha.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <Label htmlFor="commission_rate">Comissão (%)</Label>
              <Input
                id="commission_rate"
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step="0.5"
                // Typed as a percentage, stored as a fraction (5 → 0.05).
                {...register("commission_rate", { setValueAs: (v) => (v === "" ? 0 : Number(v) / 100) })}
              />
              {errors.commission_rate && (
                <span className="text-xs text-danger">Use um valor entre 0% e 100%.</span>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Adicionar"}
            </Button>
          </div>
          {errors.root && <span className="text-xs text-danger">{errors.root.message}</span>}
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { ROLE_LABELS };
