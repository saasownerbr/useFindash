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
import { signupSchema, type SignupInput } from "@/lib/validation/auth";

// Requires "Confirm email" to be OFF in Supabase (Authentication > Sign In / Providers > Email),
// so signUp returns a session right away. Keep it off until the Asaas payment flow exists.
export default function SignupPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(data: SignupInput) {
    const { data: result, error } = await createClient().auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setError("root", { message: authErrorMessage(error) });
      return;
    }

    // With email confirmation on, Supabase hides duplicates by returning a user with no identities.
    if (result.user && result.user.identities?.length === 0) {
      setError("root", { message: "Este email já tem uma conta. Entre pela tela de login." });
      return;
    }

    if (!result.session) {
      setError("root", {
        message: "Conta criada, mas o login automático não foi liberado. Tente entrar pela tela de login.",
      });
      return;
    }

    router.replace("/onboarding");
    router.refresh();
  }

  return (
    <AuthCard subtitle="Crie sua conta para começar">
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
            autoComplete="new-password"
            placeholder="Mínimo de 6 caracteres"
            className={authInputClass}
            {...register("password")}
          />
          {errors.password && <span className="text-xs text-danger">{errors.password.message}</span>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className={authInputClass}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && <span className="text-xs text-danger">{errors.confirmPassword.message}</span>}
        </div>
        {errors.root && (
          <p role="alert" className="text-sm text-danger">
            {errors.root.message}
          </p>
        )}
        <Button type="submit" disabled={isSubmitting} className="mt-2 h-11 rounded-lg font-semibold">
          {isSubmitting ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-[#6B7280] hover:text-foreground">
          Já tenho conta
        </Link>
      </p>
    </AuthCard>
  );
}
