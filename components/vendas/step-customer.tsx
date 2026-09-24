"use client";

import { useEffect, useRef, useState } from "react";
import { Check, UserPlus } from "lucide-react";

import { CustomerFormDialog } from "@/components/clientes/customer-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrencyBRL } from "@/lib/finance";
import { createClient } from "@/lib/supabase/client";
import { escapeOrFilterValue } from "@/lib/supabase/filters";
import { useSaleWizardStore } from "@/lib/sale-wizard-store";
import type { Tables } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Customer = Tables<"customers">;
type CustomerSale = { sold_at: string; products: { model: string } | null };

const DATE = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

/** Right block: details of the customer picked in the search, confirmed with "Usar este cliente". */
function CustomerPreview({
  customer,
  storeId,
  selected,
  onUse,
}: {
  customer: Customer;
  storeId: string | null;
  selected: boolean;
  onUse: () => void;
}) {
  const [sales, setSales] = useState<CustomerSale[] | null>(null);

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    setSales(null);
    createClient()
      .from("sales")
      .select("sold_at, products(model)")
      .eq("store_id", storeId)
      .eq("customer_id", customer.id)
      .order("sold_at", { ascending: false })
      .then(({ data }) => {
        if (!cancelled) setSales((data ?? []) as CustomerSale[]);
      });
    return () => {
      cancelled = true;
    };
  }, [customer.id, storeId]);

  const lastSale = sales?.[0];
  const currentModel = sales?.find((s) => s.products)?.products?.model;

  return (
    <div className="flex h-full flex-col rounded-xl bg-card shadow-card p-4 md:p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">
          {customer.name.trim().charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-foreground">{customer.name}</p>
          <p className="text-sm text-muted-foreground">{customer.whatsapp}</p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">LTV acumulado</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-foreground">{formatCurrencyBRL(Number(customer.ltv))}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Última compra</dt>
          <dd className="mt-0.5 text-foreground">
            {sales === null ? (
              <span className="inline-block h-4 w-32 animate-pulse rounded bg-secondary/60" />
            ) : lastSale ? (
              `${lastSale.products?.model ?? "Acessórios"} · ${DATE.format(new Date(lastSale.sold_at))}`
            ) : (
              "Nenhuma compra"
            )}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-muted-foreground">Modelo atual (referência de upgrade)</dt>
          <dd className="mt-0.5 font-semibold text-foreground">
            {sales === null ? (
              <span className="inline-block h-4 w-24 animate-pulse rounded bg-secondary/60" />
            ) : (
              currentModel ?? "—"
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-auto pt-5">
        {selected ? (
          <p className="flex items-center justify-center gap-2 rounded-md bg-[rgba(16,185,129,0.12)] py-2 text-sm font-medium text-[#10B981]">
            <Check className="h-4 w-4" aria-hidden />
            Cliente selecionado
          </p>
        ) : (
          <Button className="w-full" onClick={onUse}>
            Usar este cliente
          </Button>
        )}
      </div>
    </div>
  );
}

export function StepCustomer({ storeId }: { storeId: string | null }) {
  const customer = useSaleWizardStore((s) => s.customer);
  const setCustomer = useSaleWizardStore((s) => s.setCustomer);

  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Customer[] | null>(null);
  const [preview, setPreview] = useState<Customer | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Coming back to step 1 shows the customer already chosen.
  useEffect(() => {
    if (!storeId || !customer || preview) return;
    let cancelled = false;
    createClient()
      .from("customers")
      .select("*")
      .eq("id", customer.id)
      .eq("store_id", storeId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setPreview(data);
      });
    return () => {
      cancelled = true;
    };
  }, [storeId, customer, preview]);

  useEffect(() => {
    if (!storeId || !term) {
      setResults(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const escaped = escapeOrFilterValue(term);
      const { data } = await createClient()
        .from("customers")
        .select("*")
        .eq("store_id", storeId)
        .or(`name.ilike.%${escaped}%,whatsapp.ilike.%${escaped}%`)
        .limit(10);
      setResults(data ?? []);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [term, storeId]);

  function use(c: Customer) {
    setCustomer({ id: c.id, name: c.name, whatsapp: c.whatsapp });
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-3">
        <Input
          placeholder="Buscar por nome ou WhatsApp"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          autoComplete="off"
        />

        {results && results.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum cliente encontrado para &quot;{term}&quot;.</p>
        )}

        {results && results.length > 0 && (
          <div className="overflow-hidden rounded-xl bg-card shadow-card">
            {results.map((result) => (
              <button
                key={result.id}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between gap-3 border-b border-border px-4 py-3 text-left text-sm last:border-0 hover:bg-secondary/40",
                  preview?.id === result.id && "bg-primary/10"
                )}
                onClick={() => setPreview(result)}
              >
                <span className="truncate font-medium text-foreground">{result.name}</span>
                <span className="shrink-0 text-muted-foreground">{result.whatsapp}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {preview ? (
        <CustomerPreview
          customer={preview}
          storeId={storeId}
          selected={customer?.id === preview.id}
          onUse={() => use(preview)}
        />
      ) : (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-[#242424] bg-[#242424]/30 p-6 text-center">
          <p className="text-sm text-[#808080]">Selecione um cliente para ver os detalhes</p>
          <Button type="button" variant="secondary" onClick={() => setFormOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" aria-hidden />
            Novo cliente
          </Button>
        </div>
      )}

      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        storeId={storeId}
        customer={null}
        onSaved={(created) => {
          setPreview(created);
          use(created);
        }}
      />
    </div>
  );
}
