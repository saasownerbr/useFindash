"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import { createClient } from "@/lib/supabase/client";
import { onboardingSchema, type OnboardingInput } from "@/lib/validation/onboarding";

export default function OnboardingPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingInput>({ resolver: zodResolver(onboardingSchema) });

  async function onSubmit(data: OnboardingInput) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { error } = await supabase.rpc("create_store_with_owner", {
      store_name: data.storeName,
      owner_name: data.ownerName,
      monthly_goal: 0,
      store_cnpj: data.cnpj,
    });

    if (error) {
      setError("root", { message: "Não foi possível criar a loja. Tente novamente." });
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl bg-card shadow-card p-8">
        <div className="mb-6 flex justify-center">
          <Logo size="md" />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Vamos configurar o essencial antes de você começar.
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ownerName">Seu nome</Label>
            <Input id="ownerName" autoComplete="name" placeholder="Ex: Ana Souza" {...register("ownerName")} />
            {errors.ownerName && <span className="text-xs text-danger">{errors.ownerName.message}</span>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="storeName">Nome da loja</Label>
            <Input id="storeName" placeholder="Ex: iStore Centro" {...register("storeName")} />
            {errors.storeName && <span className="text-xs text-danger">{errors.storeName.message}</span>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cnpj">CPF ou CNPJ (opcional)</Label>
            <Input id="cnpj" inputMode="numeric" placeholder="Digite o CPF ou o CNPJ" {...register("cnpj")} />
            {errors.cnpj && <span className="text-xs text-danger">{errors.cnpj.message}</span>}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Criando..." : "Criar loja"}
          </Button>
          {errors.root && <span className="text-xs text-danger">{errors.root.message}</span>}
        </form>
      </div>
    </div>
  );
}
