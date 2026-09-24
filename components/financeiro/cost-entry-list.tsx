"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { TYPE_LABELS } from "@/components/financeiro/cost-entry-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExpandableRow } from "@/components/ui/row-toggle";
import { createClient } from "@/lib/supabase/client";
import { formatCurrencyBRL } from "@/lib/finance";
import { toast } from "@/lib/toast";
import type { Tables } from "@/lib/supabase/types";

type CostEntry = Tables<"cost_entries">;

export function CostEntryList({ storeId, month, reloadKey }: { storeId: string | null; month: string; reloadKey: number }) {
  const [entries, setEntries] = useState<CostEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<CostEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const loadGenerationRef = useRef(0);

  const load = useCallback(async () => {
    if (!storeId) {
      setEntries([]);
      return;
    }
    const generation = ++loadGenerationRef.current;
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("cost_entries")
      .select("*")
      .eq("store_id", storeId)
      .eq("month", `${month}-01`)
      .order("date", { ascending: false });

    if (generation !== loadGenerationRef.current) return;

    if (fetchError) {
      setError("Não foi possível carregar os lançamentos.");
      setEntries([]);
      return;
    }
    setError(null);
    setEntries(data ?? []);
  }, [storeId, month]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  async function handleDelete() {
    if (!deletingEntry) return;
    setIsDeleting(true);
    setDeleteError(null);
    const supabase = createClient();
    const { data, error: deleteError } = await supabase
      .from("cost_entries")
      .delete()
      .eq("id", deletingEntry.id)
      .select("id");
    setIsDeleting(false);

    if (deleteError) {
      setDeleteError("Não foi possível excluir o lançamento. Tente novamente.");
      return;
    }
    if (!data || data.length === 0) {
      setDeleteError("Você não tem permissão para excluir lançamentos.");
      return;
    }
    toast.success("Lançamento excluído");
    setDeletingEntry(null);
    load();
  }

  if (error) return <p className="text-sm text-danger">{error}</p>;

  if (entries === null) {
    return (
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-md bg-card" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Nenhum lançamento neste mês.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-card">
      <table className="rtable w-full text-left text-sm">
        <thead className="border-b border-border bg-card text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Descrição</th>
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3">Valor</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <ExpandableRow key={entry.id} className="border-b border-border last:border-0">
              <td data-label="Tipo" className="px-4 py-3">
                <Badge variant="default">{TYPE_LABELS[entry.type as keyof typeof TYPE_LABELS] ?? entry.type}</Badge>
              </td>
              <td className="rt-key px-4 py-3 text-foreground">{entry.description || TYPE_LABELS[entry.type as keyof typeof TYPE_LABELS] || "—"}</td>
              <td data-label="Data" className="px-4 py-3">{new Date(entry.date).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</td>
              <td className="rt-key px-4 py-3 tabular-nums">{formatCurrencyBRL(entry.amount)}</td>
              <td data-label="" className="px-4 py-3 text-right">
                <Button variant="ghost" size="sm" onClick={() => setDeletingEntry(entry)}>
                  Excluir
                </Button>
              </td>
            </ExpandableRow>
          ))}
        </tbody>
      </table>

      <ConfirmDialog
        open={!!deletingEntry}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingEntry(null);
            setDeleteError(null);
          }
        }}
        title="Excluir lançamento"
        description="Tem certeza que deseja excluir este lançamento? Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        isConfirming={isDeleting}
        error={deleteError ?? undefined}
      />
    </div>
  );
}
