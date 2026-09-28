"use client";

import { Plus, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatCurrencyBRL } from "@/lib/finance";
import {
  newServicePart,
  OTHER_SERVICE_TYPE,
  partsTotal,
  SERVICE_STATUS_COLORS,
  SERVICE_STATUS_LABELS,
  SERVICE_TYPES,
  serviceTotal,
  type ServicePart,
  type ServiceStatus,
} from "@/lib/services";
import { cn } from "@/lib/utils";

export interface ServiceFieldsValue {
  deviceDescription: string;
  serviceType: string;
  customServiceType: string;
  parts: ServicePart[];
  laborCost: number;
  notes: string;
}

const money = (value: string) => {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

/**
 * The technical-assistance form shared by the sale wizard and /assistencia: device, service type (with "Outro"),
 * a dynamic list of replaced parts, labor and notes, with the running totals beside it (below it on phones).
 */
export function ServiceFields({
  value,
  onChange,
  idPrefix = "service",
}: {
  value: ServiceFieldsValue;
  onChange: (change: Partial<ServiceFieldsValue>) => void;
  idPrefix?: string;
}) {
  const updatePart = (id: string, change: Partial<ServicePart>) =>
    onChange({ parts: value.parts.map((part) => (part.id === id ? { ...part, ...change } : part)) });
  const removePart = (id: string) => {
    const remaining = value.parts.filter((part) => part.id !== id);
    onChange({ parts: remaining.length > 0 ? remaining : [newServicePart()] });
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-device`}>Aparelho recebido para reparo</Label>
          <Input
            id={`${idPrefix}-device`}
            placeholder="Ex: iPhone 13 128GB Preto com tela trincada"
            value={value.deviceDescription}
            onChange={(e) => onChange({ deviceDescription: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${idPrefix}-type`}>Tipo de serviço</Label>
            <Select
              id={`${idPrefix}-type`}
              value={value.serviceType}
              onChange={(e) => onChange({ serviceType: e.target.value })}
            >
              <option value="">Selecione</option>
              {SERVICE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
              <option value={OTHER_SERVICE_TYPE}>Outro</option>
            </Select>
          </div>
          {value.serviceType === OTHER_SERVICE_TYPE && (
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${idPrefix}-type-custom`}>Qual serviço?</Label>
              <Input
                id={`${idPrefix}-type-custom`}
                placeholder="Ex: Troca de alto-falante"
                value={value.customServiceType}
                onChange={(e) => onChange({ customServiceType: e.target.value })}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">Peças trocadas</span>
          <div className="flex flex-col gap-2">
            {value.parts.map((part, index) => (
              <div key={part.id} className="flex items-center gap-2">
                <Input
                  aria-label={`Peça ${index + 1}`}
                  placeholder="Ex: Tela original iPhone 13"
                  value={part.name}
                  onChange={(e) => updatePart(part.id, { name: e.target.value })}
                  className="min-w-0 flex-1"
                />
                <Input
                  aria-label={`Valor da peça ${index + 1} (R$)`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  placeholder="Valor R$"
                  value={part.value}
                  onChange={(e) => updatePart(part.id, { value: money(e.target.value) })}
                  className="w-28 shrink-0 sm:w-36"
                />
                <button
                  type="button"
                  aria-label={`Remover peça ${index + 1}`}
                  onClick={() => removePart(part.id)}
                  className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px] border border-[#242424] text-[#808080] transition-colors hover:border-[#2E2E2E] hover:text-danger"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onChange({ parts: [...value.parts, newServicePart()] })}
            className="inline-flex w-fit items-center gap-1.5 rounded-[10px] px-1 py-1 text-sm font-medium text-primary hover:underline"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Adicionar peça
          </button>
        </div>

        <div className="flex flex-col gap-2 sm:max-w-[240px]">
          <Label htmlFor={`${idPrefix}-labor`}>Mão de obra (R$)</Label>
          <Input
            id={`${idPrefix}-labor`}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder="0,00"
            value={value.laborCost}
            onChange={(e) => onChange({ laborCost: money(e.target.value) })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-notes`}>Observações (opcional)</Label>
          <textarea
            id={`${idPrefix}-notes`}
            rows={3}
            placeholder="Diagnóstico, condições de entrega, garantia do serviço..."
            value={value.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            className="w-full text-sm"
          />
        </div>
      </div>

      <ServiceSummary parts={value.parts} laborCost={value.laborCost} />
    </div>
  );
}

export function ServiceSummary({ parts, laborCost }: { parts: Pick<ServicePart, "value">[]; laborCost: number }) {
  return (
    <aside className="h-fit rounded-xl border border-[#242424] bg-[#161616] p-4 lg:sticky lg:top-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#808080]">Resumo do serviço</p>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Total em peças</dt>
          <dd className="tabular-nums text-foreground">{formatCurrencyBRL(partsTotal(parts))}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Mão de obra</dt>
          <dd className="tabular-nums text-foreground">{formatCurrencyBRL(Math.max(0, laborCost))}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-[#242424] pt-2">
          <dt className="font-semibold text-foreground">Total do serviço</dt>
          <dd className="text-lg font-bold tabular-nums" style={{ color: "#dae878" }}>
            {formatCurrencyBRL(serviceTotal(parts, laborCost))}
          </dd>
        </div>
      </dl>
    </aside>
  );
}

export function ServiceStatusBadge({ status, className }: { status: ServiceStatus; className?: string }) {
  const colors = SERVICE_STATUS_COLORS[status];
  return (
    <span
      className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium", className)}
      style={{ color: colors.color, backgroundColor: colors.background }}
    >
      {SERVICE_STATUS_LABELS[status]}
    </span>
  );
}

/** Pendente / Em andamento / Concluído / Entregue as buttons, like the payment methods in the sale. */
export function ServiceStatusPicker({
  value,
  onChange,
  label = "Status do serviço",
}: {
  value: ServiceStatus;
  onChange: (status: ServiceStatus) => void;
  label?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {(Object.keys(SERVICE_STATUS_LABELS) as ServiceStatus[]).map((status) => {
          const selected = status === value;
          const colors = SERVICE_STATUS_COLORS[status];
          return (
            <button
              key={status}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(status)}
              className="rounded-[10px] border px-3 py-2 text-sm font-medium transition-colors"
              style={
                selected
                  ? { color: colors.color, backgroundColor: colors.background, borderColor: colors.color }
                  : { color: "#D0D0D0", backgroundColor: "#111111", borderColor: "#242424" }
              }
            >
              {SERVICE_STATUS_LABELS[status]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
