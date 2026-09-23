"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import type { Tables } from "@/lib/supabase/types";
import { priceReferenceSchema, type PriceReferenceInput } from "@/lib/validation/price-reference";

type PriceReference = Tables<"price_reference">;

interface PriceReferenceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string | null;
  priceReference: PriceReference | null;
  onSaved: () => void;
}

const DEFAULT_VALUES: PriceReferenceInput = {
  model: "",
  storage: "",
  base_price: 0,
  grade_multiplier_a_plus: 0.92,
  grade_multiplier_a: 0.82,
  grade_multiplier_b: 0.68,
  grade_multiplier_c: 0.48,
};

export function PriceReferenceFormDialog({
  open,
  onOpenChange,
  storeId,
  priceReference,
  onSaved,
}: PriceReferenceFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PriceReferenceInput>({
    resolver: zodResolver(priceReferenceSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) return;
    if (priceReference) {
      reset({
        model: priceReference.model,
        storage: priceReference.storage,
        base_price: priceReference.base_price,
        grade_multiplier_a_plus: priceReference.grade_multiplier_a_plus,
        grade_multiplier_a: priceReference.grade_multiplier_a,
        grade_multiplier_b: priceReference.grade_multiplier_b,
        grade_multiplier_c: priceReference.grade_multiplier_c,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [open, priceReference, reset]);

  async function onSubmit(data: PriceReferenceInput) {
    if (!storeId) {
      setError("root", { message: "Não foi possível identificar a loja. Recarregue a página." });
      return;
    }

    const supabase = createClient();
    const payload = { ...data, store_id: storeId };

    const { error } = priceReference
      ? await supabase.from("price_reference").update(payload).eq("id", priceReference.id)
      : await supabase.from("price_reference").insert(payload);

    if (error) {
      const message =
        error.code === "23505"
          ? "Já existe uma referência para este modelo e armazenamento."
          : "Não foi possível salvar a referência de preço.";
      setError("root", { message });
      toast.error(message);
      return;
    }

    toast.success("Referência de preço salva com sucesso");
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{priceReference ? "Editar referência" : "Nova referência de preço"}</DialogTitle>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="base_price">Preço base (R$)</Label>
            <Input id="base_price" type="number" min={0} step="0.01" {...register("base_price")} />
            {errors.base_price && <span className="text-xs text-danger">{errors.base_price.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="grade_multiplier_a_plus">Multiplicador A+</Label>
              <Input id="grade_multiplier_a_plus" type="number" min={0} max={1} step="0.01" {...register("grade_multiplier_a_plus")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="grade_multiplier_a">Multiplicador A</Label>
              <Input id="grade_multiplier_a" type="number" min={0} max={1} step="0.01" {...register("grade_multiplier_a")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="grade_multiplier_b">Multiplicador B</Label>
              <Input id="grade_multiplier_b" type="number" min={0} max={1} step="0.01" {...register("grade_multiplier_b")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="grade_multiplier_c">Multiplicador C</Label>
              <Input id="grade_multiplier_c" type="number" min={0} max={1} step="0.01" {...register("grade_multiplier_c")} />
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
