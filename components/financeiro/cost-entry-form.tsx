"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import { costEntrySchema, type CostEntryInput } from "@/lib/validation/cost-entry";

const TYPE_LABELS: Record<CostEntryInput["type"], string> = {
  fixed: "Fixo",
  variable: "Variável",
  marketing: "Marketing",
  supplier: "Fornecedor",
};

export function CostEntryForm({ storeId, onSaved }: { storeId: string | null; onSaved: () => void }) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CostEntryInput>({
    resolver: zodResolver(costEntrySchema),
    defaultValues: { type: "fixed", description: "", amount: 0, date: "" },
  });

  async function onSubmit(data: CostEntryInput) {
    if (!storeId) {
      setError("root", { message: "Não foi possível identificar a loja. Recarregue a página." });
      return;
    }

    const month = `${data.date.slice(0, 7)}-01`;
    const supabase = createClient();
    const { error } = await supabase.from("cost_entries").insert({
      store_id: storeId,
      type: data.type,
      description: data.description,
      amount: data.amount,
      date: data.date,
      month,
    });

    if (error) {
      setError("root", { message: "Não foi possível salvar o lançamento." });
      toast.error("Não foi possível salvar o lançamento.");
      return;
    }

    toast.success("Lançamento adicionado");
    reset({ type: "fixed", description: "", amount: 0, date: "" });
    onSaved();
  }

  return (
    <form className="grid grid-cols-5 gap-3 rounded-lg border border-border bg-card p-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="type">Tipo</Label>
        <Select id="type" {...register("type")}>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <div className="col-span-2 flex flex-col gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Input id="description" {...register("description")} />
        {errors.description && <span className="text-xs text-danger">{errors.description.message}</span>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="amount">Valor (R$)</Label>
        <Input id="amount" type="number" min={0} step="0.01" {...register("amount")} />
        {errors.amount && <span className="text-xs text-danger">{errors.amount.message}</span>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="date">Data</Label>
        <Input id="date" type="date" {...register("date")} />
        {errors.date && <span className="text-xs text-danger">{errors.date.message}</span>}
      </div>
      <div className="col-span-5 flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Adicionar lançamento"}
        </Button>
      </div>
      {errors.root && <span className="col-span-5 text-xs text-danger">{errors.root.message}</span>}
    </form>
  );
}

export { TYPE_LABELS };
