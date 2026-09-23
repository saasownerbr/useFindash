"use client";

import { useCallback, useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { PriceReferenceFormDialog } from "@/components/configuracoes/price-reference-form-dialog";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { formatCurrencyBRL } from "@/lib/finance";
import { toast } from "@/lib/toast";
import type { Tables } from "@/lib/supabase/types";

type PriceReference = Tables<"price_reference">;

export function PriceReferenceList({ storeId }: { storeId: string | null }) {
  const [rows, setRows] = useState<PriceReference[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<PriceReference | null>(null);
  const [deletingRow, setDeletingRow] = useState<PriceReference | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!storeId) {
      setRows([]);
      return;
    }
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("price_reference")
      .select("*")
      .eq("store_id", storeId)
      .order("model");

    if (fetchError) {
      setError("Não foi possível carregar a tabela de preços.");
      setRows([]);
      return;
    }
    setError(null);
    setRows(data ?? []);
  }, [storeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete() {
    if (!deletingRow) return;
    setIsDeleting(true);
    setDeleteError(null);
    const supabase = createClient();
    const { data, error: deleteError } = await supabase
      .from("price_reference")
      .delete()
      .eq("id", deletingRow.id)
      .select("id");
    setIsDeleting(false);

    if (deleteError) {
      setDeleteError("Não foi possível excluir a referência. Tente novamente.");
      return;
    }
    if (!data || data.length === 0) {
      setDeleteError("Você não tem permissão para excluir referências de preço.");
      return;
    }
    toast.success("Referência excluída");
    setDeletingRow(null);
    load();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button
          onClick={() => {
            setEditingRow(null);
            setFormOpen(true);
          }}
        >
          Nova referência
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      {rows === null ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-card" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhuma referência de preço cadastrada ainda.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-card text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Modelo</th>
                <th className="px-4 py-3">Armazenamento</th>
                <th className="px-4 py-3">Preço base</th>
                <th className="px-4 py-3">A+ / A / B / C</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{row.model}</td>
                  <td className="px-4 py-3">{row.storage}</td>
                  <td className="px-4 py-3">{formatCurrencyBRL(row.base_price)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {(row.grade_multiplier_a_plus * 100).toFixed(0)}% / {(row.grade_multiplier_a * 100).toFixed(0)}% /{" "}
                    {(row.grade_multiplier_b * 100).toFixed(0)}% / {(row.grade_multiplier_c * 100).toFixed(0)}%
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingRow(row);
                          setFormOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeletingRow(row)}>
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PriceReferenceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        storeId={storeId}
        priceReference={editingRow}
        onSaved={load}
      />

      <ConfirmDialog
        open={!!deletingRow}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingRow(null);
            setDeleteError(null);
          }
        }}
        title="Excluir referência de preço"
        description={`Tem certeza que deseja excluir a referência de ${deletingRow?.model ?? "este item"}?`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        isConfirming={isDeleting}
        error={deleteError ?? undefined}
      />
    </div>
  );
}
