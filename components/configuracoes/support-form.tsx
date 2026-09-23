"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail } from "lucide-react";

const supportSchema = z.object({
  description: z.string().min(10, "Descreva o problema com mais detalhes").max(500, "Máximo 500 caracteres"),
  whatsapp: z.string().regex(/^\d{10,11}$/, "WhatsApp inválido (apenas números, 10 ou 11 dígitos)"),
});

type SupportInput = z.infer<typeof supportSchema>;

export function SupportForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SupportInput>({
    resolver: zodResolver(supportSchema),
  });

  const description = watch("description") || "";

  async function onSubmit(data: SupportInput) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Falha ao enviar suporte");
      }

      toast.success("Mensagem enviada com sucesso! Você receberá uma resposta em breve.");
      reset();
    } catch (error) {
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Suporte</CardTitle>
            <p className="text-sm text-muted-foreground">Envie uma mensagem para nossa equipe de suporte</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descreva o Problema</Label>
            <textarea
              id="description"
              placeholder="Explique o problema que está enfrentando..."
              className="min-h-32 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              {...register("description")}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{description.length}/500</span>
              {errors.description && (
                <span className="text-danger">{errors.description.message}</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp para Contato</Label>
            <Input
              id="whatsapp"
              type="tel"
              placeholder="11999999999"
              {...register("whatsapp")}
            />
            {errors.whatsapp && (
              <span className="text-xs text-danger">{errors.whatsapp.message}</span>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Enviando..." : "Enviar Mensagem"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
