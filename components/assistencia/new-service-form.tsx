"use client";

import { useEffect, useState } from "react";

import { CustomerPicker, type PickedCustomer } from "@/components/assistencia/customer-picker";
import { ServiceFields, ServiceStatusPicker, type ServiceFieldsValue } from "@/components/assistencia/service-fields";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { sellerDisplayName } from "@/lib/rankings";
import { newServicePart, partsForStorage, resolveServiceType, serviceTotal, type ServiceStatus } from "@/lib/services";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { toast } from "@/lib/toast";

type Seller = Tables<"store_users">;

const EMPTY_FIELDS: ServiceFieldsValue = {
  deviceDescription: "",
  serviceType: "",
  customServiceType: "",
  parts: [newServicePart()],
  laborCost: 0,
  notes: "",
};

/** Stand-alone repair (the customer only brought a device to fix), with no sale attached. */
export function NewServiceForm({
  storeId,
  onSaved,
  onCancel,
}: {
  storeId: string | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [customer, setCustomer] = useState<PickedCustomer | null>(null);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [sellerId, setSellerId] = useState("");
  const [fields, setFields] = useState<ServiceFieldsValue>({ ...EMPTY_FIELDS, parts: [newServicePart()] });
  const [status, setStatus] = useState<ServiceStatus>("pending");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    createClient()
      .from("store_users")
      .select("*")
      .eq("store_id", storeId)
      .order("name")
      .then(({ data }) => {
        if (!cancelled) setSellers(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  async function save() {
    setError(null);
    const serviceType = resolveServiceType(fields.serviceType, fields.customServiceType);
    if (!storeId) return setError("Não foi possível identificar a loja. Recarregue a página.");
    if (!customer) return setError("Selecione o cliente.");
    if (!sellerId) return setError("Selecione o vendedor responsável.");
    if (!fields.deviceDescription.trim()) return setError("Descreva o aparelho recebido.");
    if (!serviceType) return setError("Informe o tipo de serviço.");
    if (serviceTotal(fields.parts, fields.laborCost) <= 0) return setError("Informe o valor das peças ou da mão de obra.");

    setSaving(true);
    const { error: insertError } = await createClient()
      .from("sale_services")
      .insert({
        store_id: storeId,
        sale_id: null,
        customer_id: customer.id,
        seller_id: sellerId,
        device_description: fields.deviceDescription.trim(),
        service_type: serviceType,
        parts_replaced: partsForStorage(fields.parts),
        labor_cost: Math.max(0, fields.laborCost),
        notes: fields.notes.trim() || null,
        status,
      });
    setSaving(false);

    if (insertError) {
      setError("Não foi possível salvar a assistência. Tente novamente.");
      return;
    }
    toast.success("Assistência registrada");
    onSaved();
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">Cliente</span>
          <CustomerPicker storeId={storeId} value={customer} onChange={setCustomer} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="service-seller">Vendedor responsável</Label>
          <Select id="service-seller" value={sellerId} onChange={(e) => setSellerId(e.target.value)}>
            <option value="">Selecione</option>
            {sellers.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {sellerDisplayName(seller.name)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <ServiceFields value={fields} onChange={(change) => setFields((prev) => ({ ...prev, ...change }))} idPrefix="new-service" />

      <ServiceStatusPicker value={status} onChange={setStatus} />

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="button" onClick={save} disabled={saving}>
          {saving ? "Salvando..." : "Registrar assistência"}
        </Button>
      </div>
    </div>
  );
}
