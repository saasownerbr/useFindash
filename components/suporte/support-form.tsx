"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { SUPPORT_MESSAGE_MAX, formatWhatsapp, supportSchema, type SupportInput } from "@/lib/validation/support";
import { cn } from "@/lib/utils";

export function SupportForm() {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SupportInput>({
    resolver: zodResolver(supportSchema),
    defaultValues: { description: "", whatsapp: "" },
  });

  const length = (watch("description") ?? "").length;

  async function onSubmit(data: SupportInput) {
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      toast.success("Mensagem enviada! Retornaremos via WhatsApp em breve.");
      reset();
    } catch {
      toast.error("Erro ao enviar. Tente novamente.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-2xl space-y-5 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5"
    >
      <div className="space-y-2">
        <Label htmlFor="description">Descreva o problema</Label>
        <textarea
          id="description"
          rows={6}
          maxLength={SUPPORT_MESSAGE_MAX}
          placeholder="Explique detalhadamente o que aconteceu..."
          className="w-full resize-y text-sm"
          {...register("description")}
        />
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-danger">{errors.description?.message}</span>
          <span className={cn("tabular-nums", length >= SUPPORT_MESSAGE_MAX ? "text-warning" : "text-muted-foreground")}>
            {length}/{SUPPORT_MESSAGE_MAX}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="whatsapp">WhatsApp para contato</Label>
        <Controller
          control={control}
          name="whatsapp"
          render={({ field }) => (
            <Input
              id="whatsapp"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="(11) 99999-9999"
              value={field.value}
              onChange={(e) => field.onChange(formatWhatsapp(e.target.value))}
              onBlur={field.onBlur}
            />
          )}
        />
        {errors.whatsapp && <span className="text-xs text-danger">{errors.whatsapp.message}</span>}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full bg-[#3B82F6] hover:bg-[#3B82F6]/90">
        {isSubmitting ? "Enviando..." : "Enviar mensagem"}
      </Button>
    </form>
  );
}
