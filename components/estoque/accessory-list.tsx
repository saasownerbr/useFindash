"use client";

import { useCallback, useEffect, useState } from "react";

import { AccessoryFormDialog } from "@/components/estoque/accessory-form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { getActiveStoreId } from "@/lib/supabase/store";
import type { Tables } from "@/lib/supabase/types";

type Accessory = Tables<"accessories">;

export function AccessoryList() {
  const [accessories, setAccessories] = useState<Accessory[] | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [nameFilter, setNameFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<Accessory | null>(null);
  const [deletingAccessory, setDeletingAccessory] = useState<Accessory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAccessories = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const activeStoreId = await getActiveStoreId(supabase, user.id);
    setStoreId(activeStoreId);

    if (!activeStoreId) {
      setAccessories([]);
      return;
    }

    let query = supabase
      .from("accessories")
      .select("*")
      .eq("store_id", activeStoreId)
      .order("created_at", { ascending: false });

    if (nameFilter) query = query.ilike("name", `%${nameFilter}%`);

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError("Não foi possível carregar os acessórios. Tente novamente.");
      setAccessories([]);
      return;
    }

    setError(null);
    setAccessories(data ?? []);
  }, [nameFilter]);

  useEffect(() => {
    loadAccessories();
  }, [loadAccessories]);

  async function handleDelete() {
    if (!deletingAccessory) return;
    setIsDeleting(true);
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("accessories").delete().eq("id", deletingAccessory.id);
    setIsDeleting(false);

    if (deleteError) {
      setError("Não foi possível excluir o acessório. Tente novamente.");
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
                      <Button variant="ghost" size="sm" onClick={() => setDeletingAccessory(accessory)}>
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
        onOpenChange={(open) => !open && setDeletingAccessory(null)}
        title="Excluir acessório"
        description={`Tem certeza que deseja excluir ${deletingAccessory?.name ?? "este acessório"}? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        isConfirming={isDeleting}
      />
    </div>
  );
}
