"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { CHANNEL_LABELS } from "@/components/clientes/customer-form-dialog";
import { CustomerTimeline } from "@/components/clientes/customer-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { getClientStoreId } from "@/lib/supabase/client-store";
import { isBirthdayWithinDays, isInUpgradeWindow } from "@/lib/customer-alerts";
import { formatCurrencyBRL } from "@/lib/finance";
import type { Tables } from "@/lib/supabase/types";

type Customer = Tables<"customers">;
type Sale = Tables<"sales">;

export default function CustomerProfilePage() {
  const params = useParams<{ customerId: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<Sale[] | null>(null);
  const [upgradeAlertMonths, setUpgradeAlertMonths] = useState(20);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const storeId = await getClientStoreId();
      if (!storeId || cancelled) return;

      const [{ data: store }, { data: customerRow, error: customerError }, { data: salesRows, error: salesError }] =
        await Promise.all([
          supabase.from("stores").select("upgrade_alert_months").eq("id", storeId).single(),
          supabase.from("customers").select("*").eq("id", params.customerId).eq("store_id", storeId).maybeSingle(),
          supabase
            .from("sales")
            .select("*")
            .eq("customer_id", params.customerId)
            .eq("store_id", storeId)
            .order("sold_at", { ascending: false }),
        ]);

      if (cancelled) return;
      if (store) setUpgradeAlertMonths(store.upgrade_alert_months);

      if (customerError || !customerRow) {
        setNotFound(true);
        return;
      }

      setCustomer(customerRow);

      if (salesError) {
        setError("Não foi possível carregar o histórico de compras.");
        setSales([]);
        return;
      }

      setSales(salesRows ?? []);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [params.customerId]);

  if (notFound) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Cliente não encontrado.</p>
        <Button variant="secondary" onClick={() => router.push("/clientes")}>
          Voltar para clientes
        </Button>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-md bg-card" />
        ))}
      </div>
    );
  }

  const inUpgradeWindow = isInUpgradeWindow(sales?.[0]?.sold_at ?? null, upgradeAlertMonths);
  const hasUpcomingBirthday = isBirthdayWithinDays(customer.birthdate, 7);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
            <Badge variant="primary">
              {CHANNEL_LABELS[customer.acquisition_channel ?? ""] ?? customer.acquisition_channel ?? "—"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{customer.whatsapp}</p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/clientes")}>
          Voltar
        </Button>
      </div>

      {inUpgradeWindow && (
        <div className="rounded-lg border border-warning bg-warning/10 p-4 text-sm text-warning">
          Este cliente está na janela de upgrade — considere entrar em contato para oferecer um novo aparelho.
        </div>
      )}

      {hasUpcomingBirthday && (
        <div className="rounded-lg border border-primary bg-primary/10 p-4 text-sm text-primary">
          Aniversário nos próximos 7 dias — uma boa oportunidade para uma mensagem especial.
        </div>
      )}

      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <span className="text-sm text-muted-foreground">LTV acumulado</span>
          <span className="text-xl font-semibold text-foreground">{formatCurrencyBRL(customer.ltv)}</span>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Histórico de compras</h2>
        {sales === null ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-md bg-card" />
            ))}
          </div>
        ) : (
          <CustomerTimeline sales={sales} />
        )}
      </div>
    </div>
  );
}
