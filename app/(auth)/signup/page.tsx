"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import { magicLinkErrorMessage, magicLinkRedirectUrl } from "@/lib/auth/magic-link";
import { createClient } from "@/lib/supabase/client";
import { signupSchema, type SignupInput } from "@/lib/validation/auth";

export default function SignupPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(data: SignupInput) {
    const supabase = createClient();
    // The store is created in /onboarding after the link is opened; these
    // values travel as user metadata so onboarding can prefill them.
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: magicLinkRedirectUrl(),
        data: { store_name: data.storeName, store_cnpj: data.cnpj },
      },
    });

    if (error) {
      setError("root", { message: magicLinkErrorMessage(error) });
      return;
    }

    setSentTo(data.email);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8">
        <div className="mb-6 flex justify-center">
          <Logo size="lg" />
        </div>

        {sentTo ? (
          <div className="text-center" role="status">
            <p className="font-semibold text-foreground">Link enviado! Verifique sua caixa de entrada.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Abra o link enviado para <span className="text-foreground">{sentTo}</span> neste mesmo navegador para
              concluir o cadastro.
            </p>
            <button
              type="button"
              onClick={() => setSentTo(null)}
              className="mt-6 text-sm text-primary hover:text-primary/80"
            >
              Usar outro email
            </button>
          </div>
        ) : (
          <>
            <p className="text-center text-sm text-muted-foreground">Cadastre sua empresa para começar.</p>

            <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="storeName">Nome da empresa</Label>
                <Input id="storeName" placeholder="Ex: iStore Centro" {...register("storeName")} />
                {errors.storeName && <span className="text-xs text-danger">{errors.storeName.message}</span>}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input id="cnpj" inputMode="numeric" placeholder="00.000.000/0000-00" {...register("cnpj")} />
                {errors.cnpj && <span className="text-xs text-danger">{errors.cnpj.message}</span>}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" placeholder="Seu email" {...register("email")} />
                {errors.email && <span className="text-xs text-danger">{errors.email.message}</span>}
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Criar conta com magic link"}
              </Button>
              {errors.root && <span className="text-xs text-danger">{errors.root.message}</span>}
              <p className="text-center text-xs text-muted-foreground">Você receberá um link de acesso no seu email</p>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link href="/login" className="text-primary hover:text-primary/80">
                Entrar
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
