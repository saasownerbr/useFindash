"use client";

import { useState } from "react";
import { Wrench } from "lucide-react";

import { ServiceFields, ServiceStatusPicker } from "@/components/assistencia/service-fields";
import { ServiceHistory, useServiceHistory, type ServiceHistoryRecord } from "@/components/assistencia/service-history";
import { emptyService, useSaleWizardStore } from "@/lib/sale-wizard-store";
import { serviceFieldsFromRecord } from "@/lib/services";
import { cn } from "@/lib/utils";

/**
 * Optional step: the sale also includes a repair (parts + labor). Off by default; the user can just move on.
 * The customer's past services show above the form, and picking one fills it as an editable starting point.
 */
export function StepService({ storeId }: { storeId: string | null }) {
  const product = useSaleWizardStore((s) => s.product);
  const customer = useSaleWizardStore((s) => s.customer);
  const service = useSaleWizardStore((s) => s.service);
  const setService = useSaleWizardStore((s) => s.setService);
  // Fetched even while the toggle is off, so the history is there as soon as it is turned on.
  const history = useServiceHistory(storeId, customer?.id ?? null);
  const [pickedId, setPickedId] = useState<string | null>(null);

  function pick(record: ServiceHistoryRecord) {
    setPickedId(record.id);
    setService(serviceFieldsFromRecord(record));
  }

  function clear() {
    setPickedId(null);
    setService({ ...emptyService(), enabled: true, status: service.status });
  }

  function toggle() {
    const enabled = !service.enabled;
    // Start from the device picked in step 2, still editable.
    const deviceDescription =
      enabled && !service.deviceDescription && product
        ? [product.model, product.storage, product.color].filter(Boolean).join(" ")
        : service.deviceDescription;
    setService({ enabled, deviceDescription });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 rounded-xl border border-[#242424] bg-[#161616] p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[rgba(218,232,120,0.10)]">
            <Wrench className="h-4 w-4 text-primary" aria-hidden />
          </span>
          <div>
            <p id="service-toggle-label" className="text-sm font-medium text-foreground">
              Esta venda inclui serviço de assistência técnica?
            </p>
            {!service.enabled && (
              <p className="mt-1 text-xs text-muted-foreground">Ative para registrar peças trocadas e serviços realizados.</p>
            )}
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={service.enabled}
          aria-labelledby="service-toggle-label"
          onClick={toggle}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-150",
            service.enabled ? "bg-primary" : "bg-[#2E2E2E]"
          )}
        >
          <span
            className={cn(
              "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-150",
              service.enabled && "translate-x-5"
            )}
          />
        </button>
      </div>

      {service.enabled && (
        <>
          <ServiceHistory records={history} selectedId={pickedId} onPick={pick} />
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-foreground">Dados do serviço</p>
            <button
              type="button"
              onClick={clear}
              className="rounded-[10px] px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Limpar
            </button>
          </div>
          <ServiceFields value={service} onChange={setService} idPrefix="sale-service" />
          <ServiceStatusPicker value={service.status} onChange={(status) => setService({ status })} />
          <p className="text-xs text-muted-foreground">
            Só serviços concluídos ou entregues entram no faturamento. Atualize o status depois em Assistência.
          </p>
        </>
      )}
    </div>
  );
}
