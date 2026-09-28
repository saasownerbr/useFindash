"use client";

import { useEffect, useState } from "react";

import { formatCurrencyBRL } from "@/lib/finance";
import { partsFromStorage } from "@/lib/services";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export type ServiceHistoryRecord = Pick<
  Tables<"sale_services">,
  "id" | "created_at" | "device_description" | "service_type" | "parts_replaced" | "labor_cost" | "total_cost" | "notes"
>;

const DATE = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

/** The customer's last 5 services at this store, fetched once per store/customer pair. */
export function useServiceHistory(storeId: string | null, customerId: string | null) {
  const [records, setRecords] = useState<ServiceHistoryRecord[]>([]);

  useEffect(() => {
    setRecords([]);
    if (!storeId || !customerId) return;
    let cancelled = false;
    createClient()
      .from("sale_services")
      .select("id, created_at, device_description, service_type, parts_replaced, labor_cost, total_cost, notes")
      .eq("store_id", storeId)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        // No history is the same as an error here: the form just opens blank.
        if (!cancelled) setRecords(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [storeId, customerId]);

  return records;
}

/** Past services as clickable cards; picking one fills the form with it as a starting point. */
export function ServiceHistory({
  records,
  selectedId,
  onPick,
}: {
  records: ServiceHistoryRecord[];
  selectedId: string | null;
  onPick: (record: ServiceHistoryRecord) => void;
}) {
  if (records.length === 0) return null;

  return (
    <div className="space-y-2 border-b border-[#242424] pb-5">
      <p style={{ fontSize: 12, color: "#9CA3AF" }}>Histórico de atendimentos — clique para usar como base</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {records.map((record) => {
          const parts = partsFromStorage(record.parts_replaced);
          const selected = record.id === selectedId;
          return (
            <button
              key={record.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onPick(record)}
              className={cn(
                "flex flex-col gap-2 rounded-xl border bg-[#161616] p-3 text-left transition-colors",
                selected ? "border-primary" : "border-[#242424] hover:border-[#2E2E2E]"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{record.device_description}</p>
                  <p className="text-xs text-muted-foreground">{record.service_type}</p>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {DATE.format(new Date(record.created_at))}
                </span>
              </div>
              {parts.length > 0 && (
                <ul className="space-y-0.5 text-xs text-muted-foreground">
                  {parts.map((part, index) => (
                    <li key={index} className="flex justify-between gap-3">
                      <span className="truncate">{part.name}</span>
                      <span className="shrink-0 tabular-nums">{formatCurrencyBRL(part.value)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex justify-between gap-3 border-t border-[#242424] pt-2 text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {formatCurrencyBRL(Number(record.total_cost))}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
