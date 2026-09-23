"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { productFormSchema, type ProductFormInput } from "@/lib/validation/product";

type Product = Tables<"products">;

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string | null;
  product: Product | null;
  onSaved: () => void;
}

const DEFAULT_VALUES: ProductFormInput = {
  type: "new",
  model: "",
  storage: "",
  color: "",
  acquisitionCost: 0,
  repairCost: 0,
  supplier: "",
  purchaseDate: "",
  quantity: 1,
  imei: "",
};

export function ProductFormDialog({ open, onOpenChange, storeId, product, onSaved }: ProductFormDialogProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const type = watch("type");

  useEffect(() => {
    if (!open) return;

    if (product) {
      reset({
        type: product.type === "semi_novo" ? "semi_novo" : "new",
        model: product.model,
        storage: product.storage,
        color: product.color ?? "",
        acquisitionCost: product.acquisition_cost,
        repairCost: product.repair_cost,
        supplier: product.supplier ?? "",
        purchaseDate: product.purchase_date ?? "",
        quantity: 1,
        imei: product.imei ?? "",
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [open, product, reset]);

  async function onSubmit(data: ProductFormInput) {
    if (!storeId) {
      setError("root", { message: "Não foi possível identificar a loja. Recarregue a página." });
      return;
    }

    const supabase = createClient();

    if (product) {
      const { error } = await supabase
        .from("products")
        .update({
          model: data.model,
          storage: data.storage,
          color: data.color || null,
          acquisition_cost: data.acquisitionCost,
          repair_cost: data.repairCost,
          supplier: data.supplier || null,
          purchase_date: data.purchaseDate || null,
          imei: data.type === "semi_novo" ? data.imei : null,
        })
        .eq("id", product.id);

      if (error) {
        setError("root", { message: "Não foi possível salvar o aparelho. Tente novamente." });
        return;
      }
    } else if (data.type === "semi_novo") {
      const { error } = await supabase.from("products").insert({
        store_id: storeId,
        type: "semi_novo",
        model: data.model,
        storage: data.storage,
        color: data.color || null,
        acquisition_cost: data.acquisitionCost,
        repair_cost: data.repairCost,
        supplier: data.supplier || null,
        purchase_date: data.purchaseDate || null,
        imei: data.imei,
      });

      if (error) {
        setError("root", {
          message: error.message.includes("duplicate")
            ? "Já existe um aparelho cadastrado com esse IMEI."
            : "Não foi possível salvar o aparelho. Tente novamente.",
        });
        return;
      }
    } else {
      const rows = Array.from({ length: data.quantity }, () => ({
        store_id: storeId,
        type: "new" as const,
        model: data.model,
        storage: data.storage,
        color: data.color || null,
        acquisition_cost: data.acquisitionCost,
        repair_cost: data.repairCost,
        supplier: data.supplier || null,
        purchase_date: data.purchaseDate || null,
      }));

      const { error } = await supabase.from("products").insert(rows);

      if (error) {
        setError("root", { message: "Não foi possível salvar o lote de aparelhos. Tente novamente." });
        return;
      }
    }

    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product ? "Editar aparelho" : "Novo aparelho"}</DialogTitle>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          {!product && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === "new" ? "default" : "secondary"}
                size="sm"
                onClick={() => reset({ ...DEFAULT_VALUES, type: "new" })}
              >
                Novo (lote)
              </Button>
              <Button
                type="button"
                variant={type === "semi_novo" ? "default" : "secondary"}
                size="sm"
                onClick={() => reset({ ...DEFAULT_VALUES, type: "semi_novo" })}
              >
                Seminovo
              </Button>
            </div>
          )}

          <input type="hidden" {...register("type")} />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="model">Modelo</Label>
              <Input id="model" placeholder="iPhone 13" {...register("model")} />
              {errors.model && <span className="text-xs text-danger">{errors.model.message}</span>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="storage">Armazenamento</Label>
              <Input id="storage" placeholder="128GB" {...register("storage")} />
              {errors.storage && <span className="text-xs text-danger">{errors.storage.message}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="color">Cor (opcional)</Label>
              <Input id="color" {...register("color")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="supplier">Fornecedor (opcional)</Label>
              <Input id="supplier" {...register("supplier")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="acquisitionCost">
                {type === "new" ? "Custo de aquisição por unidade (R$)" : "Custo de aquisição (R$)"}
              </Label>
              <Input id="acquisitionCost" type="number" min={0} step="0.01" {...register("acquisitionCost")} />
              {errors.acquisitionCost && (
                <span className="text-xs text-danger">{errors.acquisitionCost.message}</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="repairCost">Custo de reparo (R$)</Label>
              <Input id="repairCost" type="number" min={0} step="0.01" {...register("repairCost")} />
              {errors.repairCost && <span className="text-xs text-danger">{errors.repairCost.message}</span>}
            </div>
          </div>

          {type === "semi_novo" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="imei">IMEI</Label>
              <Input id="imei" maxLength={15} {...register("imei")} />
              {errors.imei && <span className="text-xs text-danger">{errors.imei.message}</span>}
            </div>
          ) : (
            !product && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="quantity">Quantidade no lote</Label>
                <Input id="quantity" type="number" min={1} step="1" {...register("quantity")} />
                {errors.quantity && <span className="text-xs text-danger">{errors.quantity.message}</span>}
              </div>
            )
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="purchaseDate">Data de compra (opcional)</Label>
            <Input id="purchaseDate" type="date" {...register("purchaseDate")} />
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
