"use client";

import { useCallback, useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { ROLE_LABELS, SellerFormDialog } from "@/components/configuracoes/seller-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import type { Tables } from "@/lib/supabase/types";

type Seller = Tables<"store_users">;

export function SellerList({ storeId }: { storeId: string | null }) {
  const [sellers, setSellers] = useState<Seller[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [deletingSeller, setDeletingSeller] = useState<Seller | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!storeId) {
      setSellers([]);
      return;
    }
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("store_users")
      .select("*")
      .eq("store_id", storeId)
      .order("name");

    if (fetchError) {
      setError("Não foi possível carregar os vendedores.");
      setSellers([]);
      return;
    }
    setError(null);
    setSellers(data ?? []);
  }, [storeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete() {
    if (!deletingSeller) return;
    setIsDeleting(true);
    setDeleteError(null);
    const supabase = createClient();
    const { data, error: deleteError } = await supabase
      .from("store_users")
      .delete()
      .eq("id", deletingSeller.id)
      .select("id");
    setIsDeleting(false);

    if (deleteError) {
      setDeleteError("Não foi possível remover o vendedor. Tente novamente.");
      return;
    }
    if (!data || data.length === 0) {
      setDeleteError("Você não tem permissão para remover vendedores.");
      return;
    }
    toast.success("Vendedor removido da loja");
    setDeletingSeller(null);
    load();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button
          onClick={() => {
            setEditingSeller(null);
            setFormOpen(true);
          }}
        >
          Novo vendedor
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      {sellers === null ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-card" />
          ))}
        </div>
      ) : sellers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum vendedor cadastrado ainda.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-card text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Papel</th>
                <th className="px-4 py-3">Comissão</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((seller) => (
                <tr key={seller.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{seller.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant="primary">{ROLE_LABELS[seller.role as keyof typeof ROLE_LABELS] ?? seller.role}</Badge>
                  </td>
                  <td className="px-4 py-3">{(seller.commission_rate * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingSeller(seller);
                          setFormOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeletingSeller(seller)}>
                        Remover
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SellerFormDialog open={formOpen} onOpenChange={setFormOpen} storeId={storeId} seller={editingSeller} onSaved={load} />

      <ConfirmDialog
        open={!!deletingSeller}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingSeller(null);
            setDeleteError(null);
          }
        }}
        title="Remover vendedor"
        description={`Tem certeza que deseja remover ${deletingSeller?.name ?? "este vendedor"} da loja?`}
        confirmLabel="Remover"
        onConfirm={handleDelete}
        isConfirming={isDeleting}
        error={deleteError ?? undefined}
      />
    </div>
  );
}
