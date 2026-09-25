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
import { toast } from "@/lib/toast";
import { PRODUCT_ORIGINS } from "@/lib/validation/product";
import { XIAOMI_STORAGES, xiaomiFormSchema, type XiaomiFormInput } from "@/lib/validation/xiaomi";

type Product = Tables<"products">;

const DEFAULT_VALUES: XiaomiFormInput = {
  model: "",
  storage: "128GB",
  color: "",
  type: "new",
  origin: "",
  acquisitionCost: 0,
  repairCost: 0,
  quantity: 1,
  purchaseDate: "",
};

function toValues(product: Product): XiaomiFormInput {
  return {
    model: product.model,
    storage: (XIAOMI_STORAGES as readonly string[]).includes(product.storage)
      ? (product.storage as XiaomiFormInput["storage"])
      : "128GB",
    color: product.color ?? "",
    type: product.type === "semi_novo" ? "semi_novo" : "new",
    origin: (product.origin as XiaomiFormInput["origin"]) ?? "",
    acquisitionCost: product.acquisition_cost,
    repairCost: product.repair_cost,
    quantity: 1,
    purchaseDate: product.purchase_date ?? "",
  };
}

interface XiaomiFormProps {
  storeId: string | null;
  /** Editing one unit; the quantity field is hidden. Omitted to add a new batch. */
  product?: Product | null;
  onSaved?: () => void;
  onCancel?: () => void;
}

/**
 * Xiaomi stock entry. Units go into the same products table as iPhones (brand = 'xiaomi'), one row per unit, so
 * they list, sell and age in stock like any device; there is no IMEI and no used-device calculator for them.
 */
export function XiaomiForm({ storeId, product, onSaved, onCancel }: XiaomiFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<XiaomiFormInput>({
    resolver: zodResolver(xiaomiFormSchema),
    defaultValues: product ? toValues(product) : DEFAULT_VALUES,
  });

  useEffect(() => {
    reset(product ? toValues(product) : DEFAULT_VALUES);
  }, [product, reset]);

  async function onSubmit(data: XiaomiFormInput) {
    if (!storeId) {
      setError("root", { message: "Não foi possível identificar a loja. Recarregue a página." });
      return;
    }

    const fields = {
      model: data.model,
      storage: data.storage,
      color: data.color || null,
      type: data.type,
      origin: data.origin || null,
      acquisition_cost: data.acquisitionCost,
      repair_cost: data.repairCost,
      purchase_date: data.purchaseDate || null,
    };
    const supabase = createClient();

    if (product) {
      const { error } = await supabase.from("products").update(fields).eq("id", product.id);
      if (error) {
        setError("root", { message: "Não foi possível salvar o aparelho. Tente novamente." });
        return;
      }
      toast.success(`${data.model} atualizado`);
    } else {
      const rows = Array.from({ length: data.quantity }, () => ({ ...fields, store_id: storeId, brand: "xiaomi" }));
      const { error } = await supabase.from("products").insert(rows);
      if (error) {
        setError("root", { message: "Não foi possível adicionar o lote. Tente novamente." });
        return;
      }
      toast.success(
        data.quantity === 1
          ? `${data.model} adicionado ao estoque`
          : `${data.quantity} unidades de ${data.model} adicionadas ao estoque`
      );
      reset(DEFAULT_VALUES);
    }

    onSaved?.();
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="xiaomi-model">Modelo</Label>
          <Input id="xiaomi-model" placeholder="Redmi Note 13 Pro" autoComplete="off" {...register("model")} />
          {errors.model && <span className="text-xs text-danger">{errors.model.message}</span>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="xiaomi-storage">Armazenamento</Label>
          <Select id="xiaomi-storage" {...register("storage")}>
            {XIAOMI_STORAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          {errors.storage && <span className="text-xs text-danger">{errors.storage.message}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="xiaomi-color">Cor (opcional)</Label>
          <Input id="xiaomi-color" placeholder="Preto" {...register("color")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="xiaomi-type">Tipo</Label>
          <Select id="xiaomi-type" {...register("type")}>
            <option value="new">Novo (lote)</option>
            <option value="semi_novo">Seminovo</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="xiaomi-origin">Origem (opcional)</Label>
          <Select id="xiaomi-origin" {...register("origin")}>
            <option value="">Selecione</option>
            {PRODUCT_ORIGINS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="xiaomi-purchase-date">Data de compra (opcional)</Label>
          <Input id="xiaomi-purchase-date" type="date" {...register("purchaseDate")} />
        </div>
      </div>

      <div className={product ? "grid grid-cols-1 gap-4 sm:grid-cols-2" : "grid grid-cols-1 gap-4 sm:grid-cols-3"}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="xiaomi-cost">Custo de aquisição por unidade (R$)</Label>
          <Input id="xiaomi-cost" type="number" min={0} step="0.01" {...register("acquisitionCost")} />
          {errors.acquisitionCost && <span className="text-xs text-danger">{errors.acquisitionCost.message}</span>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="xiaomi-repair">Custo de reparo (R$)</Label>
          <Input id="xiaomi-repair" type="number" min={0} step="0.01" {...register("repairCost")} />
          {errors.repairCost && <span className="text-xs text-danger">{errors.repairCost.message}</span>}
        </div>
        {!product && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="xiaomi-quantity">Quantidade no lote</Label>
            <Input id="xiaomi-quantity" type="number" min={1} step="1" {...register("quantity")} />
            {errors.quantity && <span className="text-xs text-danger">{errors.quantity.message}</span>}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || !storeId}>
          {isSubmitting ? "Salvando..." : product ? "Salvar" : "Adicionar ao estoque"}
        </Button>
      </div>
      {errors.root && <span className="text-xs text-danger">{errors.root.message}</span>}
    </form>
  );
}

/** Edits one Xiaomi unit from the device list. */
export function XiaomiFormDialog({
  open,
  onOpenChange,
  storeId,
  product,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string | null;
  product: Product | null;
  onSaved: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Xiaomi</DialogTitle>
        </DialogHeader>
        <XiaomiForm
          storeId={storeId}
          product={product}
          onSaved={() => {
            onOpenChange(false);
            onSaved();
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
