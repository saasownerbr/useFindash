"use client";

import { useEffect, useRef, useState } from "react";

import { CustomerFormDialog } from "@/components/clientes/customer-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useSaleWizardStore } from "@/lib/sale-wizard-store";
import type { Tables } from "@/lib/supabase/types";

type Customer = Tables<"customers">;

export function StepCustomer({ storeId }: { storeId: string | null }) {
  const customer = useSaleWizardStore((s) => s.customer);
  const setCustomer = useSaleWizardStore((s) => s.setCustomer);

  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Customer[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!storeId || !term) {
      setResults(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("customers")
        .select("*")
        .eq("store_id", storeId)
        .or(`name.ilike.%${term}%,whatsapp.ilike.%${term}%`)
        .limit(10);
      setResults(data ?? []);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [term, storeId]);

  if (customer) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm text-muted-foreground">Cliente selecionado</p>
            <p className="text-lg font-semibold text-foreground">{customer.name}</p>
            <p className="text-sm text-muted-foreground">{customer.whatsapp}</p>
          </div>
          <Button variant="secondary" onClick={() => setCustomer(null)}>
            Trocar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Buscar por nome ou WhatsApp"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className="flex-1"
        />
        <Button type="button" variant="secondary" onClick={() => setFormOpen(true)}>
          Novo cliente
        </Button>
      </div>

      {results && results.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum cliente encontrado para &quot;{term}&quot;.</p>
      )}

      {results && results.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border">
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              className="flex w-full items-center justify-between border-b border-border px-4 py-3 text-left text-sm last:border-0 hover:bg-secondary/40"
              onClick={() => setCustomer({ id: result.id, name: result.name, whatsapp: result.whatsapp })}
            >
              <span className="font-medium text-foreground">{result.name}</span>
              <span className="text-muted-foreground">{result.whatsapp}</span>
            </button>
          ))}
        </div>
      )}

      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        storeId={storeId}
        customer={null}
        onSaved={(created) => {
          setCustomer({ id: created.id, name: created.name, whatsapp: created.whatsapp });
        }}
      />
    </div>
  );
}
