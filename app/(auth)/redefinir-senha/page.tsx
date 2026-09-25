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
import { clearAttempts } from "@/lib/auth/login-attempts";
import { createClient } from "@/lib/supabase/client";
import { PASSWORD_HINT, resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation/auth";

/** Where the recovery email lands: the browser client exchanges the link's code for a session, then the user sets a new password. */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [session, setSession] = useState<"checking" | "ready" | "missing">("checking");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  useEffect(() => {
    const supabase = createClient();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, current) => {
      if (current) setSession("ready");
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession((prev) => (prev === "ready" || data.session ? "ready" : "missing"));
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function onSubmit(data: ResetPasswordInput) {
    const { error } = await createClient().auth.updateUser({ password: data.password });
    if (error) {
      setError("root", { message: authErrorMessage(error) });
      return;
    }
    clearAttempts();
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <AuthCard subtitle="Crie uma nova senha">
      {session === "checking" ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">Validando o link...</p>
      ) : session === "missing" ? (
        <p role="alert" className="mt-8 text-center text-sm text-danger">
          Este link expirou ou já foi usado.{" "}
          <Link href="/recuperar-senha" className="underline">
            Peça um novo link
          </Link>
          .
        </p>
      ) : (
        <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Nova senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-describedby="password-hint"
              className={authInputClass}
              {...register("password")}
            />
            {errors.password ? (
              <span className="text-xs text-danger">{errors.password.message}</span>
            ) : (
              <span id="password-hint" className="text-xs text-[#808080]">
                {PASSWORD_HINT}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
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
            {isSubmitting ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
