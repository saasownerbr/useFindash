"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModelCombobox } from "@/components/ui/model-combobox";
import { Select } from "@/components/ui/select";
import { findCatalogModel, normalizeKey } from "@/lib/apple-catalog";
import { lookupImei } from "@/lib/imei-lookup";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { PRODUCT_ORIGINS, productFormSchema, type ProductFormInput } from "@/lib/validation/product";

type Product = Tables<"products">;
type ProductType = ProductFormInput["type"];

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
  origin: "",
  purchaseDate: "",
  quantity: 1,
  imei: "",
};

/** Catalog options for a model, keeping a value that isn't in the catalog (older records) selectable. */
function withCurrent(options: string[], current: string | undefined) {
  if (!current || options.some((o) => normalizeKey(o) === normalizeKey(current))) return options;
  return [current, ...options];
}

export function ProductFormDialog({ open, onOpenChange, storeId, product, onSaved }: ProductFormDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    getValues,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  // Each tab keeps what was typed in it while the dialog is open.
  const drafts = useRef<Partial<Record<ProductType, ProductFormInput>>>({});
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [imeiNote, setImeiNote] = useState<{ tone: "info" | "warn"; text: string } | null>(null);

  const type = watch("type");
  const model = watch("model");
  const storage = watch("storage");
  const color = watch("color");
  const quantity = Number(watch("quantity")) || 1;
  const catalogModel = findCatalogModel(model ?? "");
  // Storage and color come from the catalog; free text only for models outside it.
  const pickFromCatalog = !!catalogModel || !model?.trim();

  useEffect(() => {
    if (!open) return;
    drafts.current = {};
    setConfirmingClear(false);
    setImeiNote(null);

    if (product) {
      reset({
        type: product.type === "semi_novo" ? "semi_novo" : "new",
        model: product.model,
        storage: product.storage,
        color: product.color ?? "",
        acquisitionCost: product.acquisition_cost,
        repairCost: product.repair_cost,
        origin: (product.origin as ProductFormInput["origin"]) ?? "",
        purchaseDate: product.purchase_date ?? "",
        quantity: 1,
        imei: product.imei ?? "",
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [open, product, reset]);

  function switchTab(next: ProductType) {
    if (next === type) return;
    drafts.current[type] = getValues();
    reset(drafts.current[next] ?? { ...DEFAULT_VALUES, type: next });
    setConfirmingClear(false);
    setImeiNote(null);
  }

  function clearTab() {
    drafts.current[type] = undefined;
    reset({ ...DEFAULT_VALUES, type });
    setConfirmingClear(false);
    setImeiNote(null);
  }

  // A new model invalidates storage/color picked for the previous one.
  function handleModelChange(next: string) {
    setValue("model", next, { shouldValidate: !!errors.model });
    const entry = findCatalogModel(next);
    if (!entry) return;
    if (storage && !entry.storage.some((s) => normalizeKey(s) === normalizeKey(storage))) setValue("storage", "");
    if (color && !entry.colors.some((c) => normalizeKey(c) === normalizeKey(color))) setValue("color", "");
  }

  async function handleImeiChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 15);
    setValue("imei", digits, { shouldValidate: !!errors.imei });
    setImeiNote(null);
    if (digits.length < 15 || !storeId) return;

    const found = await lookupImei(createClient(), storeId, digits);
    if (found.kind === "invalid") {
      setImeiNote({ tone: "warn", text: "Esse IMEI não confere (dígito verificador inválido). Confira no aparelho: *#06#." });
    } else if (found.kind === "exact") {
      handleModelChange(found.model);
      setValue("storage", found.storage);
      setImeiNote(
        found.status === "sold"
          ? { tone: "info", text: `Aparelho já vendido pela sua loja antes: ${found.model} ${found.storage}.` }
          : { tone: "warn", text: `Este IMEI já está no seu estoque (${found.model} ${found.storage}).` }
      );
    } else if (found.kind === "tac") {
      handleModelChange(found.model);
      setImeiNote({ tone: "info", text: `Modelo identificado pelo IMEI: ${found.model}.` });
    }
  }

  async function onSubmit(data: ProductFormInput) {
    if (!storeId) {
      setError("root", { message: "Não foi possível identificar a loja. Recarregue a página." });
      return;
    }

    const supabase = createClient();
    const shared = {
      model: data.model,
      storage: data.storage,
      color: data.color || null,
      acquisition_cost: data.acquisitionCost,
      repair_cost: data.repairCost,
      origin: data.origin || null,
      purchase_date: data.purchaseDate || null,
    };
    const duplicateImei = (message: string) =>
      message.includes("duplicate") ? "Já existe um aparelho cadastrado com esse IMEI." : null;

    if (product) {
      const { error } = await supabase
        .from("products")
        .update({ ...shared, imei: data.imei || null })
        .eq("id", product.id);

      if (error) {
        setError("root", { message: duplicateImei(error.message) ?? "Não foi possível salvar o aparelho. Tente novamente." });
        return;
      }
    } else if (data.type === "semi_novo") {
      const { error } = await supabase
        .from("products")
        .insert({ ...shared, store_id: storeId, type: "semi_novo", imei: data.imei });

      if (error) {
        setError("root", { message: duplicateImei(error.message) ?? "Não foi possível salvar o aparelho. Tente novamente." });
        return;
      }
    } else {
      // A batch IMEI identifies one unit, so it goes on the first one; the rest get theirs when separated for sale.
      const rows = Array.from({ length: data.quantity }, (_, index) => ({
        ...shared,
        store_id: storeId,
        type: "new" as const,
        imei: index === 0 && data.imei ? data.imei : null,
      }));

      const { error } = await supabase.from("products").insert(rows);

      if (error) {
        setError("root", {
          message: duplicateImei(error.message) ?? "Não foi possível salvar o lote de aparelhos. Tente novamente.",
        });
        return;
      }
    }

    onOpenChange(false);
    onSaved();
  }

  const storageChoices = withCurrent(catalogModel?.storage ?? [], storage);
  const colorChoices = withCurrent(catalogModel?.colors ?? [], color);

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
                onClick={() => switchTab("new")}
              >
                Novo (lote)
              </Button>
              <Button
                type="button"
                variant={type === "semi_novo" ? "default" : "secondary"}
                size="sm"
                onClick={() => switchTab("semi_novo")}
              >
                Seminovo
              </Button>
            </div>
          )}

          <input type="hidden" {...register("type")} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="imei">IMEI</Label>
            <Input
              id="imei"
              inputMode="numeric"
              autoComplete="off"
              maxLength={15}
              placeholder={type === "new" ? "Digite o IMEI (opcional)" : "15 dígitos — disque *#06# no aparelho"}
              value={watch("imei") ?? ""}
              onChange={(e) => handleImeiChange(e.target.value)}
            />
            {errors.imei && <span className="text-xs text-danger">{errors.imei.message}</span>}
            {imeiNote && (
              <span className={imeiNote.tone === "warn" ? "text-xs text-warning" : "text-xs text-muted-foreground"}>
                {imeiNote.text}
              </span>
            )}
            {type === "new" && !product && (
              <span className="text-xs text-muted-foreground">
                Adicione o IMEI agora ou registre depois ao separar cada unidade do lote para venda.
                {quantity > 1 && " O IMEI informado fica na primeira unidade."}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="model">Modelo</Label>
            <Controller
              control={control}
              name="model"
              render={({ field }) => <ModelCombobox id="model" value={field.value} onChange={handleModelChange} />}
            />
            {errors.model && <span className="text-xs text-danger">{errors.model.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="storage">Armazenamento</Label>
              {pickFromCatalog ? (
                <Select id="storage" disabled={!catalogModel} {...register("storage")}>
                  <option value="">{catalogModel ? "Selecione" : "Escolha o modelo"}</option>
                  {storageChoices.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input id="storage" placeholder="128GB" {...register("storage")} />
              )}
              {errors.storage && <span className="text-xs text-danger">{errors.storage.message}</span>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="color">Cor (opcional)</Label>
              {pickFromCatalog ? (
                <Select id="color" disabled={!catalogModel} {...register("color")}>
                  <option value="">{catalogModel ? "Selecione" : "Escolha o modelo"}</option>
                  {colorChoices.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input id="color" {...register("color")} />
              )}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="origin">Origem (opcional)</Label>
              <Select id="origin" {...register("origin")}>
                <option value="">Selecione</option>
                {PRODUCT_ORIGINS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="purchaseDate">Data de compra (opcional)</Label>
              <Input id="purchaseDate" type="date" {...register("purchaseDate")} />
            </div>
          </div>

          {type === "new" && !product && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="quantity">Quantidade no lote</Label>
              <Input id="quantity" type="number" min={1} step="1" {...register("quantity")} />
              {errors.quantity && <span className="text-xs text-danger">{errors.quantity.message}</span>}
            </div>
          )}

          {confirmingClear ? (
            <div className="flex flex-wrap items-center justify-end gap-2 rounded-md border border-[#2A2A2A] p-3">
              <span className="mr-auto text-sm text-foreground">Deseja limpar todos os campos?</span>
              <Button type="button" variant="secondary" size="sm" onClick={() => setConfirmingClear(false)}>
                Cancelar
              </Button>
              <Button type="button" size="sm" onClick={clearTab}>
                Confirmar
              </Button>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                className="border border-[#2A2A2A] bg-transparent text-[#6B7280]"
                onClick={() => setConfirmingClear(true)}
              >
                Limpar
              </Button>
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          )}
          {errors.root && <span className="text-xs text-danger">{errors.root.message}</span>}
        </form>
      </DialogContent>
    </Dialog>
  );
}
