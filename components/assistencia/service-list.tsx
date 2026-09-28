"use client";

import { useEffect, useState } from "react";

import { ServiceStatusBadge, ServiceStatusPicker } from "@/components/assistencia/service-fields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RowToggle } from "@/components/ui/row-toggle";
import { formatCurrencyBRL } from "@/lib/finance";
import { usePeriodFilterStore } from "@/lib/period-filter-store";
import { formatPhone } from "@/lib/phone";
import { sellerDisplayName } from "@/lib/rankings";
import {
  isServiceStatus,
  partsFromStorage,
  SERVICE_STATUS_LABELS,
  SERVICE_STATUSES,
  type ServiceStatus,
} from "@/lib/services";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type ServiceRow = Tables<"sale_services"> & {
  customers: { name: string; whatsapp: string } | null;
  store_users: { name: string } | null;
};

const DATE = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

const CHIP =
  "shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors bg-card text-muted-foreground hover:text-foreground";
const CHIP_ACTIVE = "bg-primary font-bold text-primary-foreground hover:text-primary-foreground";

const statusOf = (value: string): ServiceStatus => (isServiceStatus(value) ? value : "pending");

/** Every service of the store in the selected period, filtered by status; a row opens its details. */
export function ServiceList({ storeId, reloadKey }: { storeId: string | null; reloadKey: number }) {
  const { startDate, endDate } = usePeriodFilterStore();
  const [status, setStatus] = useState<ServiceStatus | "all">("all");
  const [rows, setRows] = useState<ServiceRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [selected, setSelected] = useState<ServiceRow | null>(null);
  const [localReload, setLocalReload] = useState(0);

  useEffect(() => {
    if (!storeId || !startDate || !endDate) return;
    let cancelled = false;
    let query = createClient()
      .from("sale_services")
      .select("*, customers(name, whatsapp), store_users(name)")
      .eq("store_id", storeId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: false });
    if (status !== "all") query = query.eq("status", status);
    query.then(({ data, error: loadError }) => {
      if (cancelled) return;
      if (loadError) {
        setError("Não foi possível carregar as assistências. Tente novamente em instantes.");
        setRows([]);
        return;
      }
      setError(null);
      setRows((data ?? []) as ServiceRow[]);
    });
    return () => {
      cancelled = true;
    };
  }, [storeId, startDate, endDate, status, reloadKey, localReload]);

  const total = (rows ?? []).reduce((sum, row) => sum + Number(row.total_cost), 0);

  return (
    <div className="space-y-4">
      <div role="group" aria-label="Status" className="flex gap-1.5 overflow-x-auto">
        {(["all", ...SERVICE_STATUSES] as const).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={status === key}
            onClick={() => setStatus(key)}
            className={cn(CHIP, status === key && CHIP_ACTIVE)}
          >
            {key === "all" ? "Todos" : SERVICE_STATUS_LABELS[key]}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {rows === null ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-card" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        !error && (
          <div className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground shadow-card">
            Nenhuma assistência neste período.
          </div>
        )
      ) : (
        <div className="overflow-hidden rounded-xl bg-card shadow-card">
          <table className="rtable w-full text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Aparelho</th>
                <th className="px-4 py-3 font-medium">Serviço</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  data-open={openRow === row.id}
                  onClick={() => setSelected(row)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-secondary/30"
                >
                  <td className="rt-key px-4 py-3 font-medium text-foreground">{row.customers?.name ?? "Sem cliente"}</td>
                  <td data-label="Aparelho" className="px-4 py-3">
                    {row.device_description}
                  </td>
                  <td data-label="Serviço" className="px-4 py-3">
                    {row.service_type}
                  </td>
                  <td className="rt-key px-4 py-3 tabular-nums text-foreground">{formatCurrencyBRL(Number(row.total_cost))}</td>
                  <td data-label="Status" className="px-4 py-3">
                    <ServiceStatusBadge status={statusOf(row.status)} />
                  </td>
                  <td data-label="Data" className="px-4 py-3 tabular-nums">
                    {DATE.format(new Date(row.created_at))}
                  </td>
                  <RowToggle open={openRow === row.id} onToggle={() => setOpenRow((o) => (o === row.id ? null : row.id))} />
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between border-t border-border px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              {rows.length} {rows.length === 1 ? "assistência" : "assistências"}
            </span>
            <span className="font-semibold tabular-nums text-foreground">{formatCurrencyBRL(total)}</span>
          </div>
        </div>
      )}

      <ServiceDetailDialog
        service={selected}
        onClose={() => setSelected(null)}
        onUpdated={() => {
          setSelected(null);
          setLocalReload((k) => k + 1);
        }}
      />
    </div>
  );
}

function ServiceDetailDialog({
  service,
  onClose,
  onUpdated,
}: {
  service: ServiceRow | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [status, setStatus] = useState<ServiceStatus>("pending");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (service) setStatus(statusOf(service.status));
  }, [service]);

  async function save() {
    if (!service) return;
    setSaving(true);
    const { error } = await createClient().from("sale_services").update({ status }).eq("id", service.id);
    setSaving(false);
    if (error) {
      toast.error("Não foi possível atualizar o status.");
      return;
    }
    toast.success(`Status atualizado para ${SERVICE_STATUS_LABELS[status]}`);
    onUpdated();
  }

  const parts = service ? partsFromStorage(service.parts_replaced) : [];

  return (
    <Dialog open={!!service} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {service && (
          <>
            <DialogHeader>
              <DialogTitle>{service.service_type}</DialogTitle>
              <DialogDescription>
                {service.device_description} · {DATE.format(new Date(service.created_at))}
              </DialogDescription>
            </DialogHeader>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Cliente</dt>
                <dd className="text-foreground">{service.customers?.name ?? "—"}</dd>
                {service.customers?.whatsapp && (
                  <dd className="text-xs text-muted-foreground">{formatPhone(service.customers.whatsapp)}</dd>
                )}
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Responsável</dt>
                <dd className="text-foreground">{service.store_users ? sellerDisplayName(service.store_users.name) : "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Origem</dt>
                <dd className="text-foreground">{service.sale_id ? "Junto com uma venda" : "Avulsa"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Status atual</dt>
                <dd>
                  <ServiceStatusBadge status={statusOf(service.status)} />
                </dd>
              </div>
            </dl>

            <div className="mt-4 overflow-hidden rounded-[10px] border border-[#242424] text-sm">
              {parts.map((part, index) => (
                <div key={index} className="flex justify-between gap-3 border-b border-[#242424] px-3 py-2">
                  <span className="text-foreground">{part.name}</span>
                  <span className="tabular-nums text-muted-foreground">{formatCurrencyBRL(part.value)}</span>
                </div>
              ))}
              <div className="flex justify-between gap-3 border-b border-[#242424] px-3 py-2">
                <span className="text-muted-foreground">Mão de obra</span>
                <span className="tabular-nums text-muted-foreground">{formatCurrencyBRL(Number(service.labor_cost))}</span>
              </div>
              <div className="flex justify-between gap-3 px-3 py-2 font-semibold">
                <span className="text-foreground">Total do serviço</span>
                <span className="tabular-nums" style={{ color: "#dae878" }}>
                  {formatCurrencyBRL(Number(service.total_cost))}
                </span>
              </div>
            </div>

            {service.notes && (
              <p className="mt-4 whitespace-pre-line rounded-[10px] bg-[#161616] p-3 text-sm text-[#D0D0D0]">{service.notes}</p>
            )}

            <div className="mt-5">
              <ServiceStatusPicker value={status} onChange={setStatus} label="Atualizar status" />
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={onClose}>
                Fechar
              </Button>
              <Button type="button" onClick={save} disabled={saving || status === statusOf(service.status)}>
                {saving ? "Salvando..." : "Salvar status"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
