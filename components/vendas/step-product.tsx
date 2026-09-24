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

export function StepProduct({ storeId }: { storeId: string | null }) {
  const product = useSaleWizardStore((s) => s.product);
  const productSkipped = useSaleWizardStore((s) => s.productSkipped);
  const setProduct = useSaleWizardStore((s) => s.setProduct);
  const skipProduct = useSaleWizardStore((s) => s.skipProduct);

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
      <div className="rounded-lg border border-border bg-card p-6">
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
        <Button variant="secondary" className="mt-3" onClick={() => skipProduct()}>
          Buscar aparelho
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select value={searchMode} onChange={(e) => setSearchMode(e.target.value as "imei" | "model")} className="w-40">
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

      {results && results.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum aparelho disponível encontrado.</p>
      )}

      {results && results.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border">
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

      <div className="border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={skipProduct}>
          Pular — venda só de acessórios
        </Button>
      </div>
    </div>
  );
}
