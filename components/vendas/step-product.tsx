"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModelCombobox } from "@/components/ui/model-combobox";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useSaleWizardStore } from "@/lib/sale-wizard-store";
import type { Tables } from "@/lib/supabase/types";

type Product = Tables<"products">;

export function StepProduct({ storeId, onSkip }: { storeId: string | null; onSkip: () => void }) {
  const product = useSaleWizardStore((s) => s.product);
  const productSkipped = useSaleWizardStore((s) => s.productSkipped);
  const setProduct = useSaleWizardStore((s) => s.setProduct);
  // setProduct(null) also clears productSkipped, reopening the search.
  const unskipProduct = () => setProduct(null);

  const [searchMode, setSearchMode] = useState<"imei" | "model">("model");
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Product[] | null>(null);
  const [searching, setSearching] = useState(false);

  async function search(value = term) {
    const trimmed = value.trim();
    if (!storeId || !trimmed) return;
    setSearching(true);
    const supabase = createClient();
    let query = supabase.from("products").select("*").eq("store_id", storeId).eq("status", "available");
    query = searchMode === "imei" ? query.eq("imei", trimmed) : query.ilike("model", `%${trimmed}%`);
    const { data } = await query.limit(10);
    setResults(data ?? []);
    setSearching(false);
  }

  if (product) {
    return (
      <div className="rounded-xl bg-card shadow-card p-4 md:p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Aparelho selecionado</p>
            <p className="text-lg font-semibold text-foreground">
              {product.model} · {product.storage}
              {product.color ? ` · ${product.color}` : ""}
            </p>
            {product.grade && <Badge variant="primary">{product.grade}</Badge>}
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
        <p className="text-sm text-muted-foreground">Venda somente de acessórios, sem aparelho.</p>
        <Button variant="secondary" className="mt-3" onClick={unskipProduct}>
          Buscar aparelho
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select value={searchMode} onChange={(e) => setSearchMode(e.target.value as "imei" | "model")} className="sm:w-40">
          <option value="model">Por modelo</option>
          <option value="imei">Por IMEI</option>
        </Select>
        {searchMode === "imei" ? (
          <Input
            placeholder="Digite o IMEI (15 dígitos)"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            className="flex-1"
          />
        ) : (
          <ModelCombobox
            value={term}
            onChange={setTerm}
            onSelect={(model) => search(model)}
            placeholder="Digite o modelo (ex: 13 Pro)"
            className="flex-1"
          />
        )}
        <Button type="button" onClick={() => search()} disabled={searching}>
          {searching ? "Buscando..." : "Buscar"}
        </Button>
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="w-full rounded-md border border-[#242424] bg-transparent px-4 py-2 text-sm font-medium text-[#808080] transition-colors hover:border-[#2E2E2E] hover:text-foreground sm:w-auto"
      >
        Pular — vender apenas acessório
      </button>

      {results && results.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum aparelho disponível encontrado.</p>
      )}

      {results && results.length > 0 && (
        <div className="overflow-hidden rounded-xl bg-card shadow-card">
          {results.map((result) => {
            const price = result.final_price ?? result.suggested_price;
            return (
              <button
                key={result.id}
                type="button"
                className="flex w-full items-center justify-between border-b border-border px-4 py-3 text-left text-sm last:border-0 hover:bg-secondary/40"
                onClick={() =>
                  setProduct({
                    id: result.id,
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
                <span className="font-medium text-foreground">
                  {result.model} · {result.storage}
                  {result.color ? ` · ${result.color}` : ""} {result.grade ? `· ${result.grade}` : ""}
                </span>
                <span className="text-muted-foreground">
                  {price != null ? price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Sem preço definido"}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
