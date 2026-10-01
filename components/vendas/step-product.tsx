"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { catalogType } from "@/lib/apple-catalog";
import { formatCurrencyBRL } from "@/lib/finance";
import { createClient } from "@/lib/supabase/client";
import { useSaleWizardStore } from "@/lib/sale-wizard-store";
import type { Tables } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Product = Tables<"products">;
type BrandFilter = "all" | "iphone" | "xiaomi";

const BRAND_FILTERS: { key: BrandFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "iphone", label: "iPhone" },
  { key: "xiaomi", label: "Xiaomi" },
];

/** Watch and Mac are brand apple too: an iPhone is an apple device the catalog does not list as another type. */
const isIphone = (product: Product) => product.brand === "apple" && catalogType(product.model) === "iphone";
const inFilter = (product: Product, filter: BrandFilter) =>
  filter === "all" || (filter === "iphone" ? isIphone(product) : product.brand === filter);

const FILTER_BUTTON =
  "rounded-[10px] border border-[#242424] bg-[#111111] px-3 py-1.5 text-xs font-medium text-[#D0D0D0] transition-colors hover:border-[#2E2E2E]";
const FILTER_BUTTON_SELECTED = "border-[#dae878] bg-[rgba(218,232,120,0.08)] text-[#dae878] hover:border-[#dae878]";

export function XiaomiBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", className)}
      style={{ backgroundColor: "rgba(255,102,0,0.10)", color: "#FF6600" }}
    >
      Xiaomi
    </span>
  );
}

function matches(product: Product, term: string) {
  if (!term) return true;
  const digits = term.replace(/\D/g, "");
  // 5+ digits reads as an IMEI search.
  if (digits.length >= 5 && digits === term.replace(/\s/g, "")) return (product.imei ?? "").includes(digits);
  const haystack = `${product.model} ${product.storage} ${product.color ?? ""} ${product.brand === "xiaomi" ? "xiaomi" : isIphone(product) ? "iphone" : ""}`.toLowerCase();
  return term
    .toLowerCase()
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}

/**
 * Step 2: every available device in stock — iPhones and Xiaomi alike (both live in products) — filtered as the
 * user types a model, color or IMEI.
 */
export function StepProduct({ storeId, onSkip }: { storeId: string | null; onSkip: () => void }) {
  const product = useSaleWizardStore((s) => s.product);
  const productSkipped = useSaleWizardStore((s) => s.productSkipped);
  const setProduct = useSaleWizardStore((s) => s.setProduct);
  // setProduct(null) also clears productSkipped, reopening the search.
  const unskipProduct = () => setProduct(null);

  const [term, setTerm] = useState("");
  const [brand, setBrand] = useState<BrandFilter>("all");
  const [stock, setStock] = useState<Product[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    createClient()
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .eq("status", "available")
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoadError(!!error);
        setStock(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const results = useMemo(
    () => (stock ?? []).filter((p) => inFilter(p, brand) && matches(p, term.trim())),
    [stock, brand, term]
  );
  const xiaomiCount = (stock ?? []).filter((p) => p.brand === "xiaomi").length;

  if (product) {
    return (
      <div className="rounded-xl bg-card shadow-card p-4 md:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Aparelho selecionado</p>
            <p className="text-lg font-semibold text-foreground">
              {product.model} · {product.storage}
              {product.color ? ` · ${product.color}` : ""}
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {product.brand === "xiaomi" && <XiaomiBadge />}
              {product.grade && <Badge variant="primary">{product.grade}</Badge>}
            </div>
          </div>
          <Button variant="secondary" onClick={() => setProduct(null)}>
            Trocar
          </Button>
        </div>
      </div>
    );
  }

  if (productSkipped) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">Venda sem aparelho (acessórios ou assistência técnica).</p>
        <Button variant="secondary" className="mt-3" onClick={unskipProduct}>
          Buscar aparelho
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        type="search"
        placeholder="Buscar por modelo, cor ou IMEI (ex: 13 Pro, Redmi Note)"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        aria-label="Buscar aparelho no estoque"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Marca" className="flex flex-wrap gap-2">
          {BRAND_FILTERS.map((option) => (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={brand === option.key}
              onClick={() => setBrand(option.key)}
              className={cn(FILTER_BUTTON, brand === option.key && FILTER_BUTTON_SELECTED)}
            >
              {option.label}
              {option.key === "xiaomi" && xiaomiCount > 0 ? ` (${xiaomiCount})` : ""}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="w-full rounded-md border border-[#242424] bg-transparent px-4 py-2 text-sm font-medium text-[#808080] transition-colors hover:border-[#2E2E2E] hover:text-foreground sm:w-auto"
        >
          Pular — vender apenas acessório
        </button>
      </div>

      {stock === null ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-[#161616]" />
          ))}
        </div>
      ) : loadError ? (
        <p className="text-sm text-danger">Não foi possível carregar o estoque. Recarregue a página.</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {stock.length === 0 ? "Nenhum aparelho disponível no estoque." : "Nenhum aparelho disponível encontrado."}
        </p>
      ) : (
        <div className="max-h-[420px] overflow-y-auto rounded-xl border border-[#242424]">
          {results.map((result) => {
            const price = result.final_price ?? result.suggested_price;
            return (
              <button
                key={result.id}
                type="button"
                className="flex w-full items-center justify-between gap-3 border-b border-border px-4 py-3 text-left text-sm last:border-0 hover:bg-secondary/40"
                onClick={() =>
                  setProduct({
                    id: result.id,
                    brand: result.brand,
                    model: result.model,
                    storage: result.storage,
                    color: result.color,
                    imei: result.imei,
                    grade: result.grade,
                    acquisitionCost: result.acquisition_cost,
                    repairCost: result.repair_cost,
                    finalPrice: result.final_price,
                    suggestedPrice: result.suggested_price,
                  })
                }
              >
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="font-medium text-foreground">
                    {result.model} · {result.storage}
                    {result.color ? ` · ${result.color}` : ""}
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    {result.brand === "xiaomi" && <XiaomiBadge />}
                    {result.grade && <Badge variant="primary">{result.grade}</Badge>}
                    {result.type === "semi_novo" ? "Seminovo" : "Novo"}
                    {result.imei ? ` · IMEI …${result.imei.slice(-4)}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {price != null ? formatCurrencyBRL(Number(price)) : "Sem preço definido"}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
