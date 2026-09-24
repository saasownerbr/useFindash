"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { AuthCard, authInputClass } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authErrorMessage } from "@/lib/auth/auth-errors";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    const { error } = await createClient().auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setError("root", { message: authErrorMessage(error) });
      return;
    }

    // The middleware sends users without a store on to /onboarding.
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <AuthCard subtitle="Acesse com seu email e senha">
      <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
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
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className={authInputClass}
            {...register("password")}
          />
          {errors.password && <span className="text-xs text-danger">{errors.password.message}</span>}
        </div>
        {errors.root && (
          <p role="alert" className="text-sm text-danger">
            {errors.root.message}
          </p>
        )}
        <Button type="submit" disabled={isSubmitting} className="mt-2 h-11 rounded-lg font-semibold">
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link href="/signup" className="text-[#666666] hover:text-foreground">
          Criar conta
        </Link>
      </p>
    </AuthCard>
  );
}
