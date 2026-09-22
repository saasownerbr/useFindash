"use client";

import { Suspense, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";

function ExpiredLinkNotice() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (error !== "expired_link") {
    return null;
  }

  return (
    <p className="mt-4 text-sm text-danger">
      Esse link expirou ou já foi usado. Peça um novo abaixo.
    </p>
  );
}

export default function LoginPage() {
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8">
        <h1 className="text-xl font-semibold text-foreground">Entrar no useFindash</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enviamos um link de acesso para o seu email.
        </p>

        <Suspense fallback={null}>
          <ExpiredLinkNotice />
        </Suspense>

        {status === "sent" ? (
          <p className="mt-6 text-sm text-success">Link enviado! Confira sua caixa de entrada.</p>
        ) : (
          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="voce@loja.com" {...register("email")} />
              {errors.email && <span className="text-xs text-danger">{errors.email.message}</span>}
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Enviar link de acesso"}
            </Button>
            {status === "error" && (
              <span className="text-xs text-danger">Não foi possível enviar o link. Tente novamente.</span>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
