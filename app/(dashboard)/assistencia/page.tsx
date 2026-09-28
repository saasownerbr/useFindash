"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { NewServiceForm } from "@/components/assistencia/new-service-form";
import { ServiceList } from "@/components/assistencia/service-list";
import { PeriodSelector } from "@/components/period-selector";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import { getClientStoreId } from "@/lib/supabase/client-store";

export default function AssistenciaPage() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getClientStoreId().then((id) => {
      if (!cancelled) setStoreId(id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageContainer>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-foreground">Assistência técnica</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Reparos avulsos e os feitos junto com uma venda. Só assistências registradas em Nova Venda entram no faturamento.
            </p>
          </div>
          {!creating && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-2 h-4 w-4" aria-hidden />
              Nova assistência
            </Button>
          )}
        </header>

        {creating && (
          <section className="rounded-xl bg-card p-4 shadow-card md:p-5">
            <h2 className="mb-4 text-[13px] font-semibold text-foreground">Nova assistência avulsa</h2>
            <NewServiceForm
              storeId={storeId}
              onCancel={() => setCreating(false)}
              onSaved={() => {
                setCreating(false);
                setReloadKey((k) => k + 1);
              }}
            />
          </section>
        )}

        <PeriodSelector />
        <ServiceList storeId={storeId} reloadKey={reloadKey} />
      </div>
    </PageContainer>
  );
}
