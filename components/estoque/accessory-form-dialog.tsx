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
import type { Tables } from "@/lib/supabase/types";
import { ACCESSORY_CATEGORIES, accessorySchema, type AccessoryInput } from "@/lib/validation/accessory";

type Accessory = Tables<"accessories">;

interface AccessoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string | null;
  accessory: Accessory | null;
  onSaved: () => void;
}

const DEFAULT_VALUES: AccessoryInput = {
  name: "",
  category: "",
  quantity: 0,
  cost: 0,
  salePrice: 0,
};

export function AccessoryFormDialog({ open, onOpenChange, storeId, accessory, onSaved }: AccessoryFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AccessoryInput>({
    resolver: zodResolver(accessorySchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) return;

    if (accessory) {
      reset({
        name: accessory.name,
        category: accessory.category ?? "",
        quantity: accessory.quantity,
        cost: accessory.cost,
        salePrice: accessory.sale_price,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [open, accessory, reset]);

  const legacyCategory =
    accessory?.category && !(ACCESSORY_CATEGORIES as readonly string[]).includes(accessory.category)
      ? accessory.category
      : null;

  async function onSubmit(data: AccessoryInput) {
    if (!storeId) {
      setError("root", { message: "Não foi possível identificar a loja. Recarregue a página." });
      return;
    }

    const supabase = createClient();

    const payload = {
      name: data.name,
      category: data.category || null,
      quantity: data.quantity,
      cost: data.cost,
      sale_price: data.salePrice,
    };

    const { error } = accessory
      ? await supabase.from("accessories").update(payload).eq("id", accessory.id)
      : await supabase.from("accessories").insert({ ...payload, store_id: storeId });

    if (error) {
      setError("root", { message: "Não foi possível salvar o acessório. Tente novamente." });
      return;
    }

    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{accessory ? "Editar acessório" : "Novo acessório"}</DialogTitle>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" placeholder="Capinha MagSafe iPhone 15 Pro" {...register("name")} />
            {errors.name && <span className="text-xs text-danger">{errors.name.message}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="category">Categoria (opcional)</Label>
            <Select id="category" {...register("category")}>
              <option value="">Sem categoria</option>
              {ACCESSORY_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
              {/* Keeps a category typed before the fixed list existed. */}
              {legacyCategory && <option value={legacyCategory}>{legacyCategory}</option>}
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input id="quantity" type="number" min={0} step="1" {...register("quantity")} />
              {errors.quantity && <span className="text-xs text-danger">{errors.quantity.message}</span>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cost">Custo (R$)</Label>
              <Input id="cost" type="number" min={0} step="0.01" {...register("cost")} />
              {errors.cost && <span className="text-xs text-danger">{errors.cost.message}</span>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="salePrice">Preço de venda (R$)</Label>
              <Input id="salePrice" type="number" min={0} step="0.01" {...register("salePrice")} />
              {errors.salePrice && <span className="text-xs text-danger">{errors.salePrice.message}</span>}
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
