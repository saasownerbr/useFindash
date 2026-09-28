"use client";

import { useEffect, useRef, useState } from "react";
import { UserPlus, X } from "lucide-react";

import { CustomerFormDialog } from "@/components/clientes/customer-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPhone } from "@/lib/phone";
import { createClient } from "@/lib/supabase/client";
import { escapeOrFilterValue } from "@/lib/supabase/filters";
import type { Tables } from "@/lib/supabase/types";

type Customer = Tables<"customers">;
export type PickedCustomer = { id: string; name: string; whatsapp: string };

/** Customer search by name or WhatsApp (same as step 1 of a sale), with "Novo cliente" when they are not there. */
export function CustomerPicker({
  storeId,
  value,
  onChange,
}: {
  storeId: string | null;
  value: PickedCustomer | null;
  onChange: (customer: PickedCustomer | null) => void;
}) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Customer[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!storeId || !term.trim()) {
      setResults(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const escaped = escapeOrFilterValue(term.trim());
      const { data } = await createClient()
        .from("customers")
        .select("*")
        .eq("store_id", storeId)
        .or(`name.ilike.%${escaped}%,whatsapp.ilike.%${escaped}%`)
        .limit(8);
      setResults(data ?? []);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [term, storeId]);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[10px] border border-[#242424] bg-[#111111] px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{value.name}</p>
          <p className="text-xs text-muted-foreground">{formatPhone(value.whatsapp)}</p>
        </div>
        <button
          type="button"
          aria-label="Trocar cliente"
          onClick={() => onChange(null)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#808080] hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Buscar cliente por nome ou WhatsApp"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          autoComplete="off"
          className="min-w-0 flex-1"
        />
        <Button type="button" variant="secondary" onClick={() => setFormOpen(true)} aria-label="Novo cliente">
          <UserPlus className="h-4 w-4 sm:mr-2" aria-hidden />
          <span className="hidden sm:inline">Novo cliente</span>
        </Button>
      </div>

      {results && results.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum cliente encontrado para &quot;{term}&quot;.</p>
      )}
      {results && results.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[#242424]">
          {results.map((customer) => (
            <button
              key={customer.id}
              type="button"
              className="flex w-full items-center justify-between gap-3 border-b border-border px-4 py-3 text-left text-sm last:border-0 hover:bg-secondary/40"
              onClick={() => onChange({ id: customer.id, name: customer.name, whatsapp: customer.whatsapp })}
            >
              <span className="truncate font-medium text-foreground">{customer.name}</span>
              <span className="shrink-0 text-muted-foreground">{formatPhone(customer.whatsapp)}</span>
            </button>
          ))}
        </div>
      )}

      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        storeId={storeId}
        customer={null}
        onSaved={(created) => onChange({ id: created.id, name: created.name, whatsapp: created.whatsapp })}
      />
    </div>
  );
}
