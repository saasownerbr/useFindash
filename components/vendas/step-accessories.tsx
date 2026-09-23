"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useSaleWizardStore } from "@/lib/sale-wizard-store";
import { formatCurrencyBRL } from "@/lib/finance";
import type { Tables } from "@/lib/supabase/types";

type Accessory = Tables<"accessories">;

export function StepAccessories({ storeId }: { storeId: string | null }) {
  const accessories = useSaleWizardStore((s) => s.accessories);
  const addAccessory = useSaleWizardStore((s) => s.addAccessory);
  const removeAccessory = useSaleWizardStore((s) => s.removeAccessory);

  const [available, setAvailable] = useState<Accessory[] | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!storeId) return;
      const supabase = createClient();
      const { data } = await supabase.from("accessories").select("*").eq("store_id", storeId).gt("quantity", 0);
      if (!cancelled) setAvailable(data ?? []);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const subtotal = accessories.reduce((sum, a) => sum + a.quantity * a.unitPrice, 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-medium text-foreground">Acessórios em estoque</h3>
        {available === null ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-md bg-card" />
            ))}
          </div>
        ) : available.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum acessório disponível em estoque.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            {available.map((accessory) => (
              <div
                key={accessory.id}
                className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm last:border-0"
              >
                <div>
                  <p className="font-medium text-foreground">{accessory.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrencyBRL(accessory.sale_price)} · {accessory.quantity} em estoque
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={accessory.quantity}
                    value={quantities[accessory.id] ?? 1}
                    onChange={(e) =>
                      setQuantities((prev) => ({ ...prev, [accessory.id]: Number(e.target.value) }))
                    }
                    className="w-20"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      addAccessory({
                        accessoryId: accessory.id,
                        name: accessory.name,
                        quantity: Math.min(Math.max(1, quantities[accessory.id] ?? 1), accessory.quantity),
                        unitPrice: accessory.sale_price,
                        availableQuantity: accessory.quantity,
                      })
                    }
                  >
                    Adicionar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-foreground">Selecionados</h3>
        {accessories.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum acessório adicionado — esta etapa é opcional.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            {accessories.map((item) => (
              <div
                key={item.accessoryId}
                className="flex items-center justify-between border-b border-border px-4 py-3 text-sm last:border-0"
              >
                <span className="text-foreground">
                  {item.quantity}× {item.name}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">{formatCurrencyBRL(item.quantity * item.unitPrice)}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeAccessory(item.accessoryId)}>
                    Remover
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground">
              <span>Subtotal</span>
              <span>{formatCurrencyBRL(subtotal)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
