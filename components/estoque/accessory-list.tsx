"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AccessoryFormDialog } from "@/components/estoque/accessory-form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { getClientStoreId } from "@/lib/supabase/client-store";
import type { Tables } from "@/lib/supabase/types";

type Accessory = Tables<"accessories">;

export function AccessoryList() {
  const [accessories, setAccessories] = useState<Accessory[] | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeResolved, setStoreResolved] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<Accessory | null>(null);
  const [deletingAccessory, setDeletingAccessory] = useState<Accessory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadGenerationRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resolve the active store once on mount (or when the user changes), rather
  // than on every filter-driven reload.
  useEffect(() => {
    let cancelled = false;

    async function resolveStore() {
      const activeStoreId = await getClientStoreId();
      if (cancelled) return;

      setStoreId(activeStoreId);
      setStoreResolved(true);
    }

    resolveStore();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadAccessories = useCallback(async () => {
    if (!storeResolved) return;

    const generation = ++loadGenerationRef.current;

    if (!storeId) {
      setAccessories([]);
      return;
    }

    const supabase = createClient();

    let query = supabase
      .from("accessories")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (nameFilter) query = query.ilike("name", `%${nameFilter}%`);

    const { data, error: fetchError } = await query;

    // A newer request has started since this one was fired; discard this
    // response so it can't overwrite fresher data.
    if (generation !== loadGenerationRef.current) return;

    if (fetchError) {
      setError("Não foi possível carregar os acessórios. Tente novamente.");
      setAccessories([]);
      return;
    }

    setError(null);
    setAccessories(data ?? []);
  }, [storeId, storeResolved, nameFilter]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Debounce only while typing in the search box; the first load runs right away.
    debounceRef.current = setTimeout(() => {
      loadAccessories();
    }, nameFilter ? 300 : 0);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [loadAccessories, nameFilter]);

  async function handleDelete() {
    if (!deletingAccessory) return;
    setIsDeleting(true);
    setDeleteError(null);
    const supabase = createClient();
    const { data, error: deleteError } = await supabase
      .from("accessories")
      .delete()
      .eq("id", deletingAccessory.id)
      .select("id");
    setIsDeleting(false);

    if (deleteError) {
      setDeleteError("Não foi possível excluir o acessório. Tente novamente.");
      return;
    }

    if (!data || data.length === 0) {
      setDeleteError("Você não tem permissão para excluir acessórios.");
      return;
    }

    setDeletingAccessory(null);
    loadAccessories();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Buscar por nome</span>
          <Input
            placeholder="Capinha, película..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="w-56"
          />
        </div>
        <Button
          onClick={() => {
            setEditingAccessory(null);
            setFormOpen(true);
          }}
        >
          Novo acessório
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      {accessories === null ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-card" />
          ))}
        </div>
      ) : accessories.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum acessório encontrado. Cadastre o primeiro para começar.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-card text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Quantidade</th>
                <th className="px-4 py-3">Custo</th>
                <th className="px-4 py-3">Preço de venda</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {accessories.map((accessory) => (
                <tr key={accessory.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{accessory.name}</td>
                  <td className="px-4 py-3">{accessory.category ?? "—"}</td>
                  <td className="px-4 py-3">{accessory.quantity}</td>
                  <td className="px-4 py-3">
                    {accessory.cost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </td>
                  <td className="px-4 py-3">
                    {accessory.sale_price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingAccessory(accessory);
                          setFormOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeleteError(null);
                          setDeletingAccessory(accessory);
                        }}
                      >
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

      <AccessoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        storeId={storeId}
        accessory={editingAccessory}
        onSaved={loadAccessories}
      />

      <ConfirmDialog
        open={!!deletingAccessory}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingAccessory(null);
            setDeleteError(null);
          }
        }}
        title="Excluir acessório"
        description={`Tem certeza que deseja excluir ${deletingAccessory?.name ?? "este acessório"}? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        isConfirming={isDeleting}
        error={deleteError ?? undefined}
      />
    </div>
  );
}
