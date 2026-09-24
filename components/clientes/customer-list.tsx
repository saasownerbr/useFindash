"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { CustomerFormDialog, CHANNEL_LABELS } from "@/components/clientes/customer-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { escapeOrFilterValue } from "@/lib/supabase/filters";
import { getClientStoreId } from "@/lib/supabase/client-store";
import { isInUpgradeWindow } from "@/lib/customer-alerts";
import { toast } from "@/lib/toast";
import type { Tables } from "@/lib/supabase/types";

type Customer = Tables<"customers">;

export function CustomerList() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeResolved, setStoreResolved] = useState(false);
  const [upgradeAlertMonths, setUpgradeAlertMonths] = useState(20);
  const [lastSaleByCustomer, setLastSaleByCustomer] = useState<Map<string, string>>(new Map());
  const [searchTerm, setSearchTerm] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [upgradeFilter, setUpgradeFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadGenerationRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolveStore() {
      const activeStoreId = await getClientStoreId();
      if (cancelled) return;

      setStoreId(activeStoreId);
      setStoreResolved(true);

      if (activeStoreId) {
        const supabase = createClient();
        const [{ data: store }, { data: sales }] = await Promise.all([
          supabase.from("stores").select("upgrade_alert_months").eq("id", activeStoreId).single(),
          supabase
            .from("sales")
            .select("customer_id, sold_at")
            .eq("store_id", activeStoreId)
            .order("sold_at", { ascending: false }),
        ]);
        if (!cancelled && store) setUpgradeAlertMonths(store.upgrade_alert_months);
        if (!cancelled && sales) {
          const map = new Map<string, string>();
          for (const sale of sales) {
            if (!map.has(sale.customer_id)) map.set(sale.customer_id, sale.sold_at);
          }
          setLastSaleByCustomer(map);
        }
      }
    }

    resolveStore();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadCustomers = useCallback(async () => {
    if (!storeResolved) return;

    const generation = ++loadGenerationRef.current;

    if (!storeId) {
      setCustomers([]);
      return;
    }

    const supabase = createClient();

    let query = supabase.from("customers").select("*").eq("store_id", storeId).order("created_at", { ascending: false });

    if (searchTerm) {
      const escaped = escapeOrFilterValue(searchTerm);
      query = query.or(`name.ilike.%${escaped}%,whatsapp.ilike.%${escaped}%`);
    }
    if (channelFilter) query = query.eq("acquisition_channel", channelFilter);

    const { data, error: fetchError } = await query;

    if (generation !== loadGenerationRef.current) return;

    if (fetchError) {
      setError("Não foi possível carregar os clientes. Tente novamente.");
      setCustomers([]);
      return;
    }

    setError(null);
    setCustomers(data ?? []);
  }, [storeId, storeResolved, searchTerm, channelFilter]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Debounce only while typing a search; the first load and cleared searches run right away.
    debounceRef.current = setTimeout(() => {
      loadCustomers();
    }, searchTerm ? 300 : 0);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [loadCustomers, searchTerm]);

  async function handleDelete() {
    if (!deletingCustomer) return;
    setIsDeleting(true);
    setDeleteError(null);
    const supabase = createClient();
    const { data, error: deleteError } = await supabase
      .from("customers")
      .delete()
      .eq("id", deletingCustomer.id)
      .select("id");
    setIsDeleting(false);

    if (deleteError) {
      setDeleteError("Não foi possível excluir o cliente. Tente novamente.");
      return;
    }

    if (!data || data.length === 0) {
      setDeleteError("Você não tem permissão para excluir clientes.");
      return;
    }

    toast.success("Cliente excluído com sucesso");
    setDeletingCustomer(null);
    loadCustomers();
  }

  const visibleCustomers = (customers ?? []).filter((customer) => {
    if (!upgradeFilter) return true;
    const lastSale = lastSaleByCustomer.get(customer.id) ?? null;
    const inWindow = isInUpgradeWindow(lastSale, upgradeAlertMonths);
    return upgradeFilter === "in_window" ? inWindow : !inWindow;
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Buscar</span>
            <Input
              placeholder="Nome ou WhatsApp"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-56"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Canal de origem</span>
            <Select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} className="w-44">
              <option value="">Todos</option>
              {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Status de upgrade</span>
            <Select value={upgradeFilter} onChange={(e) => setUpgradeFilter(e.target.value)} className="w-48">
              <option value="">Todos</option>
              <option value="in_window">Em janela de upgrade</option>
              <option value="out_window">Fora da janela</option>
            </Select>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingCustomer(null);
            setFormOpen(true);
          }}
        >
          Novo cliente
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      {customers === null ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-card" />
          ))}
        </div>
      ) : visibleCustomers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum cliente encontrado. Cadastre o primeiro cliente para começar.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-card text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3">Canal</th>
                <th className="px-4 py-3">LTV</th>
                <th className="px-4 py-3">Upgrade</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {visibleCustomers.map((customer) => {
                const lastSale = lastSaleByCustomer.get(customer.id) ?? null;
                const inWindow = isInUpgradeWindow(lastSale, upgradeAlertMonths);
                return (
                  <tr
                    key={customer.id}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-secondary/40"
                    onClick={() => router.push(`/clientes/${customer.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{customer.name}</td>
                    <td className="px-4 py-3">{customer.whatsapp}</td>
                    <td className="px-4 py-3">
                      <Badge variant="primary">
                        {CHANNEL_LABELS[customer.acquisition_channel ?? ""] ?? customer.acquisition_channel ?? "—"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {customer.ltv.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td className="px-4 py-3">
                      {inWindow ? <Badge variant="warning">Janela de upgrade</Badge> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingCustomer(customer);
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
                            setDeletingCustomer(customer);
                          }}
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        storeId={storeId}
        customer={editingCustomer}
        onSaved={loadCustomers}
      />

      <ConfirmDialog
        open={!!deletingCustomer}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingCustomer(null);
            setDeleteError(null);
          }
        }}
        title="Excluir cliente"
        description={`Tem certeza que deseja excluir ${deletingCustomer?.name ?? "este cliente"}? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        isConfirming={isDeleting}
        error={deleteError ?? undefined}
      />
    </div>
  );
}
