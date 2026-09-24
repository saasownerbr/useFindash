"use client";

import { useCallback, useEffect, useState } from "react";

import { SettingsCard } from "@/components/configuracoes/settings-card";
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
  { key: "screen_cost", label: "Troca de tela" },
  { key: "battery_cost", label: "Troca de bateria" },
  { key: "camera_cost", label: "Troca de câmera" },
];

const EMPTY_DRAFT: Draft = { screen_cost: "", battery_cost: "", camera_cost: "" };

const GRID = "grid grid-cols-[minmax(140px,1.6fr)_repeat(3,minmax(90px,1fr))_auto] items-center gap-2";

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
  const [adding, setAdding] = useState(false);
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
    const values = fromDraft(drafts[row.id]);
    if (COST_FIELDS.every((f) => values[f.key] === row[f.key])) return;
    const { data, error } = await createClient()
      .from("repair_costs")
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", row.id)
      .select("*")
      .single();
    if (error || !data) {
      toast.error("Não foi possível salvar os custos.");
      setDrafts((d) => ({ ...d, [row.id]: toDraft(row) }));
      return;
    }
    setRows((list) => list?.map((r) => (r.id === data.id ? data : r)) ?? null);
    toast.success(`Custos do ${row.model} salvos`);
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
    toast.success(`${newModel} adicionado`);
    setAdding(false);
    setNewModel("");
    setNewDraft(EMPTY_DRAFT);
    load();
  }

  const usedModels = new Set((rows ?? []).map((r) => normalizeKey(r.model)));
  const availableModels = IPHONE_MODELS.map((m) => m.model).filter((m) => !usedModels.has(normalizeKey(m)));

  return (
    <SettingsCard
      title="Calculadora de Seminovo"
      description="A calculadora desconta a margem mínima do preço de revenda e sugere estes custos de reparo."
    >
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="minMargin">Margem mínima desejada (%)</Label>
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
        <Button onClick={saveMargin} disabled={savingMargin || !storeId}>
          {savingMargin ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Custos de reparo por modelo (R$)</h3>
        <Button size="sm" variant="secondary" onClick={() => setAdding(true)} disabled={!storeId || adding}>
          Adicionar modelo
        </Button>
      </div>

      <div className="mt-3 overflow-x-auto">
        <div className="min-w-[560px]">
          <div className={`${GRID} border-b border-[#242424] pb-2 text-xs text-muted-foreground`}>
            <span>Modelo</span>
            {COST_FIELDS.map((f) => (
              <span key={f.key}>{f.label}</span>
            ))}
            <span className="sr-only">Ações</span>
          </div>

          {adding && (
            <div className={`${GRID} border-b border-[#242424] bg-primary/5 py-2`}>
              <Select aria-label="Modelo" value={newModel} onChange={(e) => setNewModel(e.target.value)}>
                <option value="">Selecione</option>
                {availableModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
              {COST_FIELDS.map((field) => (
                <Input
                  key={field.key}
                  aria-label={field.label}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={newDraft[field.key]}
                  onChange={(e) => setNewDraft((d) => ({ ...d, [field.key]: e.target.value }))}
                />
              ))}
              <div className="flex gap-1">
                <Button size="sm" onClick={addRow} disabled={!newModel}>
                  Salvar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {rows === null ? (
            <div className="mt-3 h-10 animate-pulse rounded-md bg-background/60" />
          ) : rows.length === 0 && !adding ? (
            <p className="py-4 text-sm text-muted-foreground">Nenhum modelo configurado ainda.</p>
          ) : (
            rows.map((row) => (
              <div key={row.id} className={`${GRID} border-b border-[#242424] py-2 last:border-0`}>
                <span className="truncate text-sm font-medium text-foreground">{row.model}</span>
                {COST_FIELDS.map((field) => (
                  <Input
                    key={field.key}
                    aria-label={`${field.label} — ${row.model}`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    placeholder="—"
                    value={drafts[row.id]?.[field.key] ?? ""}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [row.id]: { ...d[row.id], [field.key]: e.target.value } }))
                    }
                    onBlur={() => saveRow(row)}
                    onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                  />
                ))}
                <Button size="sm" variant="ghost" onClick={() => deleteRow(row)}>
                  Remover
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </SettingsCard>
  );
}
