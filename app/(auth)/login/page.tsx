"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import { magicLinkErrorMessage, magicLinkRedirectUrl } from "@/lib/auth/magic-link";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";

export default function LoginPage() {
  const [authError, setAuthError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    const hasAuthError = document.cookie.split(";").some((c) => c.trim().startsWith("auth_error="));
    if (hasAuthError) {
      setAuthError("Esse link de acesso expirou ou já foi usado. Peça um novo abaixo.");
      document.cookie = "auth_error=; max-age=0; path=/";
    }
  }, []);

  async function onSubmit(data: LoginInput) {
    setAuthError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: { shouldCreateUser: false, emailRedirectTo: magicLinkRedirectUrl() },
    });

    if (error) {
      setAuthError(magicLinkErrorMessage(error));
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
              Enviamos o link de acesso para <span className="text-foreground">{sentTo}</span>. Abra o email neste
              mesmo navegador.
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
            <p className="text-center text-sm text-muted-foreground">Acesse com seu email</p>

            <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" placeholder="Seu email" {...register("email")} />
                {errors.email && <span className="text-xs text-danger">{errors.email.message}</span>}
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Entrar com magic link"}
              </Button>
              {authError && <span className="text-xs text-danger">{authError}</span>}
              <p className="text-center text-xs text-muted-foreground">Você receberá um link de acesso no seu email</p>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Não tem conta?{" "}
              <Link href="/signup" className="text-primary hover:text-primary/80">
                Criar conta
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
