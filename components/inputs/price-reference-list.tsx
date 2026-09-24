"use client";

import { useCallback, useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { SettingsCard } from "@/components/configuracoes/settings-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModelCombobox } from "@/components/ui/model-combobox";
import { Select } from "@/components/ui/select";
import { findCatalogModel } from "@/lib/apple-catalog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import type { Tables } from "@/lib/supabase/types";

type PriceReference = Tables<"price_reference">;

// Price in R$; multipliers typed as percentages (92) and stored as fractions (0.92).
const FIELDS = [
  { key: "base_price", label: "Preço Base", percent: false },
  { key: "grade_multiplier_a_plus", label: "Mult. A+", percent: true },
  { key: "grade_multiplier_a", label: "Mult. A", percent: true },
  { key: "grade_multiplier_b", label: "Mult. B", percent: true },
  { key: "grade_multiplier_c", label: "Mult. C", percent: true },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];
type Draft = Record<FieldKey, string>;

const NEW_ROW: Draft & { model: string; storage: string } = {
  model: "",
  storage: "",
  base_price: "",
  grade_multiplier_a_plus: "92",
  grade_multiplier_a: "82",
  grade_multiplier_b: "68",
  grade_multiplier_c: "48",
};

const GRID = "grid grid-cols-[minmax(150px,1.6fr)_minmax(90px,0.9fr)_repeat(5,minmax(80px,1fr))_auto] items-center gap-2";

function toDraft(row: PriceReference): Draft {
  return Object.fromEntries(
    FIELDS.map((f) => [f.key, String(f.percent ? Math.round(row[f.key] * 1000) / 10 : row[f.key])])
  ) as Draft;
}

/** Parses a draft; null when any value is missing or out of range. */
function fromDraft(draft: Draft) {
  const values: Partial<Record<FieldKey, number>> = {};
  for (const f of FIELDS) {
    const n = Number(draft[f.key].replace(",", "."));
    if (draft[f.key].trim() === "" || !Number.isFinite(n) || n < 0 || (f.percent && n > 100)) return null;
    if (!f.percent && n <= 0) return null;
    values[f.key] = f.percent ? n / 100 : n;
  }
  return values as Record<FieldKey, number>;
}

export function PriceReferenceList({ storeId }: { storeId: string | null }) {
  const [rows, setRows] = useState<PriceReference[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [newRow, setNewRow] = useState<typeof NEW_ROW | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingRow, setDeletingRow] = useState<PriceReference | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!storeId) return;
    const { data, error: fetchError } = await createClient()
      .from("price_reference")
      .select("*")
      .eq("store_id", storeId)
      .order("model")
      .order("storage");

    if (fetchError) {
      setError("Não foi possível carregar a tabela de preços.");
      setRows([]);
      return;
    }
    setError(null);
    setRows(data ?? []);
    setDrafts(Object.fromEntries((data ?? []).map((r) => [r.id, toDraft(r)])));
  }, [storeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveRow(row: PriceReference) {
    const draft = drafts[row.id];
    if (!draft) return;
    const values = fromDraft(draft);
    if (!values) {
      toast.error("Preço precisa ser maior que zero e multiplicadores entre 0% e 100%.");
      setDrafts((d) => ({ ...d, [row.id]: toDraft(row) }));
      return;
    }
    if (FIELDS.every((f) => values[f.key] === row[f.key])) return;

    const { data, error: updateError } = await createClient()
      .from("price_reference")
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", row.id)
      .select("*")
      .single();

    if (updateError || !data) {
      toast.error("Não foi possível salvar. Só donos e administradores podem alterar preços.");
      setDrafts((d) => ({ ...d, [row.id]: toDraft(row) }));
      return;
    }
    setRows((list) => list?.map((r) => (r.id === data.id ? data : r)) ?? null);
    toast.success(`${data.model} ${data.storage} atualizado`);
  }

  async function addRow() {
    if (!storeId || !newRow) return;
    const values = fromDraft(newRow);
    if (!newRow.model.trim() || !newRow.storage.trim() || !values) {
      toast.error("Preencha modelo, armazenamento e um preço base maior que zero.");
      return;
    }
    const { error: insertError } = await createClient()
      .from("price_reference")
      .insert({ store_id: storeId, model: newRow.model.trim(), storage: newRow.storage.trim(), ...values });
    if (insertError) {
      toast.error(
        insertError.code === "23505"
          ? "Esse modelo e armazenamento já estão na tabela."
          : "Não foi possível adicionar. Só donos e administradores podem alterar preços."
      );
      return;
    }
    toast.success(`${newRow.model} ${newRow.storage} adicionado`);
    setNewRow(null);
    load();
  }

  async function handleDelete() {
    if (!deletingRow) return;
    setIsDeleting(true);
    setDeleteError(null);
    const { data, error: deleteErr } = await createClient()
      .from("price_reference")
      .delete()
      .eq("id", deletingRow.id)
      .select("id");
    setIsDeleting(false);

    if (deleteErr || !data || data.length === 0) {
      setDeleteError("Não foi possível excluir. Só donos e administradores podem alterar preços.");
      return;
    }
    toast.success("Referência excluída");
    setDeletingRow(null);
    load();
  }

  const newRowStorages = newRow ? findCatalogModel(newRow.model)?.storage : undefined;

  return (
    <SettingsCard
      title="Tabela de Preços de Referência"
      description="Preço de mercado por modelo e o quanto cada grade vale sobre ele. Os valores salvam ao sair do campo."
      action={
        <Button size="sm" onClick={() => setNewRow({ ...NEW_ROW })} disabled={!storeId || !!newRow}>
          Adicionar modelo
        </Button>
      }
    >
      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className={`${GRID} border-b border-[#242424] pb-2 text-xs text-muted-foreground`}>
            <span>Modelo</span>
            <span>Armazenamento</span>
            {FIELDS.map((f) => (
              <span key={f.key}>
                {f.label}
                {f.percent ? " (%)" : " (R$)"}
              </span>
            ))}
            <span className="sr-only">Ações</span>
          </div>

          {newRow && (
            <div className={`${GRID} border-b border-[#242424] bg-primary/5 py-2`}>
              <ModelCombobox
                value={newRow.model}
                onChange={(model) => setNewRow((r) => r && { ...r, model })}
                placeholder="Modelo"
              />
              {newRowStorages ? (
                <Select
                  aria-label="Armazenamento"
                  value={newRow.storage}
                  onChange={(e) => setNewRow((r) => r && { ...r, storage: e.target.value })}
                >
                  <option value="">—</option>
                  {newRowStorages.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  aria-label="Armazenamento"
                  placeholder="128GB"
                  value={newRow.storage}
                  onChange={(e) => setNewRow((r) => r && { ...r, storage: e.target.value })}
                />
              )}
              {FIELDS.map((f) => (
                <Input
                  key={f.key}
                  aria-label={f.label}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={f.percent ? "1" : "0.01"}
                  value={newRow[f.key]}
                  onChange={(e) => setNewRow((r) => r && { ...r, [f.key]: e.target.value })}
                />
              ))}
              <div className="flex gap-1">
                <Button size="sm" onClick={addRow}>
                  Salvar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setNewRow(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {rows === null ? (
            <div className="mt-3 h-10 animate-pulse rounded-md bg-background/60" />
          ) : rows.length === 0 && !newRow ? (
            <p className="py-4 text-sm text-muted-foreground">
              Nenhum preço cadastrado. A calculadora e o preço sugerido usam esta tabela.
            </p>
          ) : (
            rows.map((row) => (
              <div key={row.id} className={`${GRID} border-b border-[#242424] py-2 last:border-0`}>
                <span className="truncate text-sm font-medium text-foreground">{row.model}</span>
                <span className="text-sm text-muted-foreground">{row.storage}</span>
                {FIELDS.map((f) => (
                  <Input
                    key={f.key}
                    aria-label={`${f.label} — ${row.model} ${row.storage}`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={f.percent ? "1" : "0.01"}
                    value={drafts[row.id]?.[f.key] ?? ""}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [row.id]: { ...d[row.id], [f.key]: e.target.value } }))
                    }
                    onBlur={() => saveRow(row)}
                    onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                  />
                ))}
                <Button size="sm" variant="ghost" onClick={() => setDeletingRow(row)}>
                  Excluir
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deletingRow}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingRow(null);
            setDeleteError(null);
          }
        }}
        title="Excluir referência"
        description={`Tem certeza que deseja excluir a referência de ${deletingRow?.model ?? ""} ${deletingRow?.storage ?? ""}?`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        isConfirming={isDeleting}
        error={deleteError ?? undefined}
      />
    </SettingsCard>
  );
}
