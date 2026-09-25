"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatPhone } from "@/lib/phone";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import type { Tables } from "@/lib/supabase/types";
import { customerSchema, type CustomerInput } from "@/lib/validation/customer";

type Customer = Tables<"customers">;

const CHANNEL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  pdv: "Loja física",
  referral: "Indicação",
  paid_traffic: "Tráfego pago",
};

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string | null;
  customer: Customer | null;
  onSaved: (customer: Customer) => void;
}

const DEFAULT_VALUES: CustomerInput = {
  name: "",
  whatsapp: "",
  birthdate: "",
  acquisition_channel: "instagram",
};

export function CustomerFormDialog({ open, onOpenChange, storeId, customer, onSaved }: CustomerFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) return;

    if (customer) {
      reset({
        name: customer.name,
        whatsapp: formatPhone(customer.whatsapp),
        birthdate: customer.birthdate ?? "",
        acquisition_channel: (customer.acquisition_channel as CustomerInput["acquisition_channel"]) ?? "instagram",
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [open, customer, reset]);

  async function onSubmit(data: CustomerInput) {
    if (!storeId) {
      setError("root", { message: "Não foi possível identificar a loja. Recarregue a página." });
      return;
    }

    const supabase = createClient();
    const payload = {
      name: data.name,
      whatsapp: data.whatsapp,
      birthdate: data.birthdate || null,
      acquisition_channel: data.acquisition_channel,
    };

    if (customer) {
      const { data: updated, error } = await supabase
        .from("customers")
        .update(payload)
        .eq("id", customer.id)
        .select("*")
        .single();

      if (error || !updated) {
        setError("root", { message: "Não foi possível salvar o cliente." });
        toast.error("Não foi possível salvar o cliente.");
        return;
      }

      toast.success("Cliente salvo com sucesso");
      onOpenChange(false);
      onSaved(updated);
      return;
    }

    const { data: created, error } = await supabase
      .from("customers")
      .insert({ ...payload, store_id: storeId })
      .select("*")
      .single();

    if (error || !created) {
      setError("root", { message: "Não foi possível salvar o cliente." });
      toast.error("Não foi possível salvar o cliente.");
      return;
    }

    toast.success("Cliente salvo com sucesso");
    onOpenChange(false);
    onSaved(created);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{customer ? "Editar cliente" : "Novo cliente"}</DialogTitle>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" placeholder="Maria Silva" {...register("name")} />
            {errors.name && <span className="text-xs text-danger">{errors.name.message}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              type="tel"
              placeholder="(11) 9 9999-8888"
              // Any typing is accepted; it is tidied into (XX) X XXXX-XXXX when the field is left.
              {...register("whatsapp", { onBlur: (e) => setValue("whatsapp", formatPhone(e.target.value)) })}
            />
            {errors.whatsapp && <span className="text-xs text-danger">{errors.whatsapp.message}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="birthdate">Data de nascimento (opcional)</Label>
              <Input id="birthdate" type="date" {...register("birthdate")} />
              {errors.birthdate && <span className="text-xs text-danger">{errors.birthdate.message}</span>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="acquisition_channel">Canal de origem</Label>
              <Select id="acquisition_channel" {...register("acquisition_channel")}>
                {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              {errors.acquisition_channel && (
                <span className="text-xs text-danger">{errors.acquisition_channel.message}</span>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
          {errors.root && <span className="text-xs text-danger">{errors.root.message}</span>}
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { CHANNEL_LABELS };
