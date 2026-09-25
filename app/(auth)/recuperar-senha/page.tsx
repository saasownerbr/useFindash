"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { AuthCard, authInputClass } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authErrorMessage } from "@/lib/auth/auth-errors";
import { createClient } from "@/lib/supabase/client";
import { recoverPasswordSchema, type RecoverPasswordInput } from "@/lib/validation/auth";

// Must be in Supabase > Authentication > URL Configuration > Redirect URLs.
const PASSWORD_RESET_REDIRECT = "https://www.byfindash.com.br/auth/callback";

export default function RecoverPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RecoverPasswordInput>({ resolver: zodResolver(recoverPasswordSchema) });

  // The login lockout passes the email it was trying.
  useEffect(() => {
    const email = new URLSearchParams(window.location.search).get("email");
    if (email) setValue("email", email);
  }, [setValue]);

  async function onSubmit(data: RecoverPasswordInput) {
    const { error } = await createClient().auth.resetPasswordForEmail(data.email, {
      redirectTo: PASSWORD_RESET_REDIRECT,
    });
    if (error) {
      setError("root", { message: authErrorMessage(error) });
      return;
    }
    setSentTo(data.email);
  }

  return (
    <AuthCard subtitle="Recupere o acesso à sua conta">
      {sentTo ? (
        <p role="status" className="mt-8 text-center text-sm text-muted-foreground">
          Se <span className="text-foreground">{sentTo}</span> tiver uma conta, enviamos um link para criar uma nova senha.
          Confira a caixa de entrada e o spam.
        </p>
      ) : (
        <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email da conta</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@loja.com"
              className={authInputClass}
              {...register("email")}
            />
            {errors.email && <span className="text-xs text-danger">{errors.email.message}</span>}
          </div>
          {errors.root && (
            <p role="alert" className="text-sm text-danger">
              {errors.root.message}
            </p>
          )}
          <Button type="submit" disabled={isSubmitting} className="mt-2 h-11 rounded-lg font-semibold">
            {isSubmitting ? "Enviando..." : "Enviar link de recuperação"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-[#666666] hover:text-foreground">
          Voltar para o login
        </Link>
      </p>
    </AuthCard>
  );
}
