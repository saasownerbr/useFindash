"use client";

import { useCallback, useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { ROLE_LABELS, SellerFormDialog } from "@/components/configuracoes/seller-form-dialog";
import { SettingsCard } from "@/components/configuracoes/settings-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import type { Tables } from "@/lib/supabase/types";

type Seller = Tables<"store_users">;
type Draft = { name: string; commission: string };

const toDraft = (s: Seller): Draft => ({
  name: s.name,
  commission: String(Math.round(s.commission_rate * 1000) / 10),
});

/** Name and commission edit in place and save when the field loses focus. */
export function SellerList({ storeId }: { storeId: string | null }) {
  const [sellers, setSellers] = useState<Seller[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deletingSeller, setDeletingSeller] = useState<Seller | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!storeId) return;
    const { data, error: fetchError } = await createClient()
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
    setDrafts(Object.fromEntries((data ?? []).map((s) => [s.id, toDraft(s)])));
  }, [storeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveSeller(seller: Seller) {
    const draft = drafts[seller.id];
    if (!draft) return;
    const name = draft.name.trim();
    const percent = Number(draft.commission.replace(",", "."));
    if (name === seller.name && percent / 100 === seller.commission_rate) return;

    if (!name || !Number.isFinite(percent) || percent < 0 || percent > 100) {
      toast.error("Informe um nome e uma comissão entre 0% e 100%.");
      setDrafts((d) => ({ ...d, [seller.id]: toDraft(seller) }));
      return;
    }

    const { data, error: updateError } = await createClient()
      .from("store_users")
      .update({ name, commission_rate: percent / 100 })
      .eq("id", seller.id)
      .select("*")
      .single();

    if (updateError || !data) {
      toast.error("Não foi possível salvar. Só donos e administradores podem editar vendedores.");
      setDrafts((d) => ({ ...d, [seller.id]: toDraft(seller) }));
      return;
    }
    setSellers((list) => list?.map((s) => (s.id === data.id ? data : s)) ?? null);
    toast.success(`${data.name} atualizado`);
  }

  async function handleDelete() {
    if (!deletingSeller) return;
    setIsDeleting(true);
    setDeleteError(null);
    const { data, error: deleteErr } = await createClient()
      .from("store_users")
      .delete()
      .eq("id", deletingSeller.id)
      .select("id");
    setIsDeleting(false);

    if (deleteErr) {
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

  const setDraft = (id: string, patch: Partial<Draft>) => setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));

  return (
    <SettingsCard
      title="Vendedores"
      description="Nome e comissão de cada vendedor. As alterações salvam ao sair do campo."
      action={
        <Button size="sm" onClick={() => setFormOpen(true)} disabled={!storeId}>
          Adicionar vendedor
        </Button>
      }
    >
      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      {sellers === null ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-background/60" />
          ))}
        </div>
      ) : sellers.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum vendedor cadastrado ainda.</p>
      ) : (
        <div className="divide-y divide-[#242424]">
          <div className="hidden grid-cols-[minmax(0,1fr)_140px_auto] gap-3 pb-2 text-xs text-muted-foreground sm:grid">
            <span>Nome</span>
            <span>Comissão (%)</span>
            <span className="sr-only">Ações</span>
          </div>
          {sellers.map((seller) => (
            <div key={seller.id} className="grid grid-cols-[minmax(0,1fr)_110px_auto] items-center gap-3 py-2 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
              <div className="flex min-w-0 items-center gap-2">
                <Input
                  aria-label={`Nome de ${seller.name}`}
                  value={drafts[seller.id]?.name ?? ""}
                  onChange={(e) => setDraft(seller.id, { name: e.target.value })}
                  onBlur={() => saveSeller(seller)}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                />
                {seller.role !== "seller" && (
                  <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                    {ROLE_LABELS[seller.role as keyof typeof ROLE_LABELS] ?? seller.role}
                  </span>
                )}
              </div>
              <Input
                aria-label={`Comissão de ${seller.name} (%)`}
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step="0.5"
                value={drafts[seller.id]?.commission ?? ""}
                onChange={(e) => setDraft(seller.id, { commission: e.target.value })}
                onBlur={() => saveSeller(seller)}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              />
              <Button variant="ghost" size="sm" onClick={() => setDeletingSeller(seller)}>
                Remover
              </Button>
            </div>
          ))}
        </div>
      )}

      <SellerFormDialog open={formOpen} onOpenChange={setFormOpen} storeId={storeId} onSaved={load} />

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
    </SettingsCard>
  );
}
