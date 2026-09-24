"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { ProductFormDialog } from "@/components/estoque/product-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RowToggle } from "@/components/ui/row-toggle";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { getClientStoreId } from "@/lib/supabase/client-store";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/types";

type Product = Tables<"products">;

const STATUS_LABELS: Record<string, string> = {
  available: "Disponível",
  reserved: "Reservado",
  sold: "Vendido",
};

const STATUS_VARIANTS: Record<string, "success" | "warning" | "default"> = {
  available: "success",
  reserved: "warning",
  sold: "default",
};

const TYPE_LABELS: Record<string, string> = {
  new: "Novo",
  semi_novo: "Seminovo",
};

export function ProductList() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeResolved, setStoreResolved] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [openRow, setOpenRow] = useState<string | null>(null);

  // /estoque?novo=<id> comes from the used-device calculator after adding a product.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("novo");
    if (!id) return;
    setHighlightId(id);
    window.history.replaceState(null, "", window.location.pathname);
    const timer = setTimeout(() => setHighlightId(null), 6000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (highlightId && products) {
      document.getElementById(`product-${highlightId}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [highlightId, products]);

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

  const loadProducts = useCallback(async () => {
    if (!storeResolved) return;

    const generation = ++loadGenerationRef.current;

    if (!storeId) {
      setProducts([]);
      return;
    }

    const supabase = createClient();

    let query = supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (statusFilter) query = query.eq("status", statusFilter);
    if (typeFilter) query = query.eq("type", typeFilter);
    if (modelFilter) query = query.ilike("model", `%${modelFilter}%`);

    const { data, error: fetchError } = await query;

    // A newer request has started since this one was fired; discard this
    // response so it can't overwrite fresher data.
    if (generation !== loadGenerationRef.current) return;

    if (fetchError) {
      setError("Não foi possível carregar o estoque. Tente novamente.");
      setProducts([]);
      return;
    }

    setError(null);
    setProducts(data ?? []);
  }, [storeId, storeResolved, statusFilter, typeFilter, modelFilter]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Debounce only while typing in the search box; the first load runs right away.
    debounceRef.current = setTimeout(() => {
      loadProducts();
    }, modelFilter ? 300 : 0);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [loadProducts, modelFilter]);

  async function handleDelete() {
    if (!deletingProduct) return;
    setIsDeleting(true);
    setDeleteError(null);
    const supabase = createClient();
    const { data, error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", deletingProduct.id)
      .select("id");
    setIsDeleting(false);

    if (deleteError) {
      setDeleteError("Não foi possível excluir o aparelho. Tente novamente.");
      return;
    }

    if (!data || data.length === 0) {
      setDeleteError("Você não tem permissão para excluir aparelhos.");
      return;
    }

    setDeletingProduct(null);
    loadProducts();
  }

  async function handleStatusChange(product: Product, status: "available" | "reserved") {
    const supabase = createClient();
    const { error: updateError } = await supabase.from("products").update({ status }).eq("id", product.id);

    if (updateError) {
      setError("Não foi possível atualizar o status. Tente novamente.");
      return;
    }

    loadProducts();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Status</span>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
              <option value="">Todos</option>
              <option value="available">Disponível</option>
              <option value="reserved">Reservado</option>
              <option value="sold">Vendido</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Tipo</span>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-40">
              <option value="">Todos</option>
              <option value="new">Novo</option>
              <option value="semi_novo">Seminovo</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Modelo</span>
            <Input
              placeholder="Buscar por modelo"
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              className="w-48"
            />
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingProduct(null);
            setFormOpen(true);
          }}
        >
          Novo aparelho
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      {products === null ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-card" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum aparelho encontrado. Cadastre o primeiro aparelho para começar.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-card shadow-card">
          <table className="rtable w-full text-left text-sm">
            <thead className="border-b border-border bg-card text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Modelo</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">IMEI</th>
                <th className="px-4 py-3">Custo</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Dias em estoque</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  id={`product-${product.id}`}
                  data-open={openRow === product.id}
                  className={cn(
                    "border-b border-border transition-colors duration-700 last:border-0",
                    product.id === highlightId && "bg-primary/10 outline outline-1 -outline-offset-1 outline-primary"
                  )}
                >
                  <td className="rt-key px-4 py-3 font-medium text-foreground">
                    {product.model} · {product.storage}
                    {product.color ? ` · ${product.color}` : ""}
                  </td>
                  <td data-label="Tipo" className="px-4 py-3">{TYPE_LABELS[product.type] ?? product.type}</td>
                  <td data-label="IMEI" className="px-4 py-3">{product.imei ?? "—"}</td>
                  <td data-label="Custo" className="px-4 py-3">
                    {(product.acquisition_cost + product.repair_cost).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                  <td className="rt-key px-4 py-3">
                    <Badge variant={STATUS_VARIANTS[product.status] ?? "default"}>
                      {STATUS_LABELS[product.status] ?? product.status}
                    </Badge>
                  </td>
                  <td data-label="Dias em estoque" className="px-4 py-3">{product.days_in_stock}</td>
                  <td data-label="" className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      {product.status === "available" && (
                        <Button variant="ghost" size="sm" onClick={() => handleStatusChange(product, "reserved")}>
                          Reservar
                        </Button>
                      )}
                      {product.status === "reserved" && (
                        <Button variant="ghost" size="sm" onClick={() => handleStatusChange(product, "available")}>
                          Liberar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingProduct(product);
                          setFormOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      {product.status !== "sold" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeleteError(null);
                            setDeletingProduct(product);
                          }}
                        >
                          Excluir
                        </Button>
                      )}
                    </div>
                  </td>
                  <RowToggle
                    open={openRow === product.id}
                    onToggle={() => setOpenRow((id) => (id === product.id ? null : product.id))}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        storeId={storeId}
        product={editingProduct}
        onSaved={loadProducts}
      />

      <ConfirmDialog
        open={!!deletingProduct}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingProduct(null);
            setDeleteError(null);
          }
        }}
        title="Excluir aparelho"
        description={`Tem certeza que deseja excluir ${deletingProduct?.model ?? "este aparelho"}? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        isConfirming={isDeleting}
        error={deleteError ?? undefined}
      />
    </div>
  );
}
