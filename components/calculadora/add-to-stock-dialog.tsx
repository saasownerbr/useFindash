"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { colorOptions } from "@/lib/iphone-models";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/types";
import { toast } from "@/lib/toast";
import type { Grade } from "@/lib/used-device-calculator";
import { PRODUCT_ORIGINS } from "@/lib/validation/product";

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export interface AddToStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string | null;
  imei: string;
  model: string;
  storage: string;
  grade: Grade;
  repairTotal: number;
  offerPrice: string;
  suggestedPrice: number;
  checkupData: Json;
}

export function AddToStockDialog(props: AddToStockDialogProps) {
  const router = useRouter();
  const [imei, setImei] = useState("");
  const [acquisitionCost, setAcquisitionCost] = useState("");
  const [repairCost, setRepairCost] = useState("");
  const [origin, setOrigin] = useState("");
  const [color, setColor] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(today());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { open, imei: initialImei, offerPrice, repairTotal } = props;
  useEffect(() => {
    if (!open) return;
    setImei(initialImei);
    setAcquisitionCost(offerPrice);
    setRepairCost(String(Math.round(repairTotal * 100) / 100));
    setOrigin("");
    setColor("");
    setPurchaseDate(today());
    setError(null);
  }, [open, initialImei, offerPrice, repairTotal]);

  async function handleConfirm() {
    const cost = Number(acquisitionCost);
    const repair = Number(repairCost || 0);
    if (!/^\d{15}$/.test(imei)) return setError("IMEI precisa ter 15 dígitos numéricos.");
    if (!(cost > 0)) return setError("Informe quanto você pagou pelo aparelho.");
    if (!(repair >= 0)) return setError("Custo de reparo não pode ser negativo.");
    if (!props.storeId) return setError("Não foi possível identificar a loja. Recarregue a página.");

    setSaving(true);
    setError(null);
    const { data, error: insertError } = await createClient()
      .from("products")
      .insert({
        store_id: props.storeId,
        type: "semi_novo",
        imei,
        model: props.model,
        storage: props.storage,
        acquisition_cost: cost,
        repair_cost: repair,
        grade: props.grade,
        suggested_price: Math.round(props.suggestedPrice * 100) / 100,
        color: color || null,
        origin: origin || null,
        purchase_date: purchaseDate || null,
        checkup_data: props.checkupData,
      })
      .select("id")
      .single();
    setSaving(false);

    if (insertError || !data) {
      setError(
        insertError?.code === "23505"
          ? "Esse IMEI já está cadastrado no estoque."
          : "Não foi possível adicionar ao estoque. Tente novamente."
      );
      return;
    }

    toast.success(`${props.model} ${props.storage} adicionado ao estoque`);
    props.onOpenChange(false);
    router.push(`/estoque?novo=${data.id}`);
  }

  return (
    <Dialog open={open} onOpenChange={props.onOpenChange}>
      <DialogContent className="rounded-xl border-[#242424] bg-[#1A1A1A]">
        <DialogHeader>
          <DialogTitle>Adicionar ao estoque</DialogTitle>
          <DialogDescription>
            Confira os dados e informe quanto você pagou pelo aparelho.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="col-span-2 flex flex-col gap-2 sm:col-span-1">
              <Label htmlFor="stock-model">Modelo</Label>
              <Input id="stock-model" readOnly value={`${props.model} ${props.storage}`} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="stock-type">Tipo</Label>
              <Input id="stock-type" readOnly value="Seminovo" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="stock-grade">Grade</Label>
              <Input id="stock-grade" readOnly value={props.grade === "sucata" ? "Sucata" : props.grade} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="stock-imei">IMEI</Label>
            <Input
              id="stock-imei"
              inputMode="numeric"
              maxLength={15}
              value={imei}
              onChange={(e) => setImei(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          {colorOptions(props.model).length > 0 && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="stock-color">Cor (opcional)</Label>
              <Select id="stock-color" value={color} onChange={(e) => setColor(e.target.value)}>
                <option value="">Selecione</option>
                {colorOptions(props.model).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="stock-cost">Custo de aquisição (R$)</Label>
              <Input
                id="stock-cost"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                placeholder="Quanto você pagou"
                value={acquisitionCost}
                onChange={(e) => setAcquisitionCost(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="stock-repair">Custo de reparo (R$)</Label>
              <Input
                id="stock-repair"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={repairCost}
                onChange={(e) => setRepairCost(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="stock-origin">Origem</Label>
              <Select id="stock-origin" value={origin} onChange={(e) => setOrigin(e.target.value)}>
                <option value="">Selecione</option>
                {PRODUCT_ORIGINS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="stock-date">Data de compra</Label>
              <Input id="stock-date" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </div>
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => props.onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={saving}>
              {saving ? "Adicionando..." : "Adicionar ao estoque"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
