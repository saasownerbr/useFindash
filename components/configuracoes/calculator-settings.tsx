"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { IPHONE_MODELS, normalizeKey } from "@/lib/iphone-models";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { toast } from "@/lib/toast";

type RepairCost = Tables<"repair_costs">;
type CostField = "screen_cost" | "battery_cost" | "camera_cost";
type Draft = Record<CostField, string>;

const COST_FIELDS: { key: CostField; label: string }[] = [
  { key: "screen_cost", label: "Tela" },
  { key: "battery_cost", label: "Bateria" },
  { key: "camera_cost", label: "Câmera" },
];

const EMPTY_DRAFT: Draft = { screen_cost: "", battery_cost: "", camera_cost: "" };

function toDraft(row: RepairCost): Draft {
  return {
    screen_cost: row.screen_cost === null ? "" : String(row.screen_cost),
    battery_cost: row.battery_cost === null ? "" : String(row.battery_cost),
    camera_cost: row.camera_cost === null ? "" : String(row.camera_cost),
  };
}

function fromDraft(draft: Draft) {
  const parse = (v: string) => (v.trim() === "" ? null : Math.max(0, Number(v)));
  return {
    screen_cost: parse(draft.screen_cost),
    battery_cost: parse(draft.battery_cost),
    camera_cost: parse(draft.camera_cost),
  };
}

export function CalculatorSettings({ storeId }: { storeId: string | null }) {
  const [marginPercent, setMarginPercent] = useState("20");
  const [savingMargin, setSavingMargin] = useState(false);
  const [rows, setRows] = useState<RepairCost[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [newModel, setNewModel] = useState("");
  const [newDraft, setNewDraft] = useState<Draft>(EMPTY_DRAFT);

  const load = useCallback(async () => {
    if (!storeId) return;
    const supabase = createClient();
    const [store, costs] = await Promise.all([
      supabase.from("stores").select("min_margin").eq("id", storeId).single(),
      supabase.from("repair_costs").select("*").eq("store_id", storeId).order("model"),
    ]);
    if (store.data) setMarginPercent(String(Math.round(Number(store.data.min_margin) * 1000) / 10));
    const list = costs.data ?? [];
    setRows(list);
    setDrafts(Object.fromEntries(list.map((r) => [r.id, toDraft(r)])));
  }, [storeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveMargin() {
    const value = Number(marginPercent);
    if (!storeId || !(value >= 0 && value < 100)) {
      toast.error("A margem precisa estar entre 0% e 99%.");
      return;
    }
    setSavingMargin(true);
    const { error } = await createClient().from("stores").update({ min_margin: value / 100 }).eq("id", storeId);
    setSavingMargin(false);
    if (error) toast.error("Não foi possível salvar a margem. Só donos e administradores podem alterar.");
    else toast.success("Margem mínima salva");
  }

  async function saveRow(row: RepairCost) {
    const { error } = await createClient()
      .from("repair_costs")
      .update({ ...fromDraft(drafts[row.id]), updated_at: new Date().toISOString() })
      .eq("id", row.id);
    if (error) toast.error("Não foi possível salvar os custos.");
    else toast.success(`Custos do ${row.model} salvos`);
  }

  async function deleteRow(row: RepairCost) {
    const { error } = await createClient().from("repair_costs").delete().eq("id", row.id);
    if (error) toast.error("Não foi possível remover.");
    else load();
  }

  async function addRow() {
    if (!storeId || !newModel) return;
    const { error } = await createClient()
      .from("repair_costs")
      .insert({ store_id: storeId, model: newModel, ...fromDraft(newDraft) });
    if (error) {
      toast.error(error.code === "23505" ? "Esse modelo já está na tabela." : "Não foi possível adicionar.");
      return;
    }
    setNewModel("");
    setNewDraft(EMPTY_DRAFT);
    toast.success(`${newModel} adicionado`);
    load();
  }

  const usedModels = new Set((rows ?? []).map((r) => normalizeKey(r.model)));
  const availableModels = IPHONE_MODELS.map((m) => m.model).filter((m) => !usedModels.has(normalizeKey(m)));

  return (
    <div className="max-w-3xl space-y-6">
      <section className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
        <h2 className="text-base font-semibold text-foreground">Margem mínima desejada</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A calculadora desconta essa margem do preço de revenda para chegar ao valor máximo de compra.
        </p>
        <div className="mt-4 flex items-end gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="minMargin">Margem (%)</Label>
            <Input
              id="minMargin"
              type="number"
              inputMode="decimal"
              min={0}
              max={99}
              step="0.5"
              className="w-32"
              value={marginPercent}
              onChange={(e) => setMarginPercent(e.target.value)}
            />
          </div>
          <Button onClick={saveMargin} disabled={savingMargin}>
            {savingMargin ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
        <h2 className="text-base font-semibold text-foreground">Custos de reparo por modelo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Quanto custa trocar tela, bateria e câmera de cada modelo. A calculadora usa esses valores como sugestão.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-dashed border-border p-3 sm:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))_auto] sm:items-end">
          <div className="col-span-2 flex flex-col gap-2 sm:col-span-1">
            <Label htmlFor="newModel">Modelo</Label>
            <Select id="newModel" value={newModel} onChange={(e) => setNewModel(e.target.value)}>
              <option value="">Selecione</option>
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </div>
          {COST_FIELDS.map((field) => (
            <div key={field.key} className="flex flex-col gap-2">
              <Label htmlFor={`new-${field.key}`}>{field.label} (R$)</Label>
              <Input
                id={`new-${field.key}`}
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={newDraft[field.key]}
                onChange={(e) => setNewDraft((d) => ({ ...d, [field.key]: e.target.value }))}
              />
            </div>
          ))}
          <Button onClick={addRow} disabled={!newModel}>
            Adicionar
          </Button>
        </div>

        {rows === null ? (
          <div className="mt-4 h-12 animate-pulse rounded-md bg-background/60" />
        ) : rows.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nenhum modelo configurado ainda.</p>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-2 gap-3 py-3 sm:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))_auto] sm:items-center"
              >
                <span className="col-span-2 text-sm font-medium text-foreground sm:col-span-1">{row.model}</span>
                {COST_FIELDS.map((field) => (
                  <Input
                    key={field.key}
                    aria-label={`${field.label} — ${row.model}`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    placeholder={field.label}
                    value={drafts[row.id]?.[field.key] ?? ""}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [row.id]: { ...d[row.id], [field.key]: e.target.value } }))
                    }
                  />
                ))}
                <div className="flex gap-1">
                  <Button size="sm" variant="secondary" onClick={() => saveRow(row)}>
                    Salvar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteRow(row)}>
                    Remover
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
