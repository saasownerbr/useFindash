"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { AuthCard, authInputClass } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authErrorMessage } from "@/lib/auth/auth-errors";
import {
  clearAttempts,
  currentAttempts,
  isLockedOut,
  readAttempts,
  recordFailure,
  remainingAttempts,
  saveAttempts,
  wrongPasswordMessage,
} from "@/lib/auth/login-attempts";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";

const RECOVERY_PATH = "/recuperar-senha";
const REDIRECT_DELAY_MS = 2000;

export default function LoginPage() {
  const router = useRouter();
  const [lockedEmail, setLockedEmail] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  // Still locked from a previous visit in this tab (under 15 minutes ago): straight to recovery.
  useEffect(() => {
    if (isLockedOut(currentAttempts(readAttempts(), Date.now()))) setLockedEmail("");
  }, []);

  useEffect(() => {
    if (lockedEmail === null) return;
    const target = lockedEmail ? `${RECOVERY_PATH}?email=${encodeURIComponent(lockedEmail)}` : RECOVERY_PATH;
    const timer = setTimeout(() => router.replace(target), REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [lockedEmail, router]);

  async function onSubmit(data: LoginInput) {
    const { error } = await createClient().auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      // Only wrong credentials count towards the lockout; network or rate-limit errors do not.
      if (error.code !== "invalid_credentials") {
        setError("root", { message: authErrorMessage(error) });
        return;
      }
      const attempts = recordFailure(readAttempts(), Date.now());
      saveAttempts(attempts);
      if (isLockedOut(attempts)) {
        setLockedEmail(data.email);
        return;
      }
      setError("root", { message: wrongPasswordMessage(remainingAttempts(attempts)) });
      return;
    }

    clearAttempts();
    // The middleware sends users without a store on to /onboarding.
    router.replace("/dashboard");
    router.refresh();
  }

  if (lockedEmail !== null) {
    return (
      <AuthCard subtitle="Acesse com seu email e senha">
        <p role="alert" className="mt-8 text-center text-sm text-danger">
          Muitas tentativas incorretas. Redirecionando para recuperação de senha...
        </p>
      </AuthCard>
    );
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link href={RECOVERY_PATH} className="text-xs text-[#808080] hover:text-foreground">
              Esqueci minha senha
            </Link>
          </div>
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
