"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import { createClient } from "@/lib/supabase/client";
import { signupSchema, type SignupInput } from "@/lib/validation/auth";

export default function SignupPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(data: SignupInput) {
    const supabase = createClient();

    // A retry after a partial failure (e.g. store creation failed but the
    // auth account was already created) leaves an active session in the
    // browser. Reuse it instead of calling signUp again, which would fail
    // with "already registered" and dead-end the user.
    const {
      data: { session: existingSession },
    } = await supabase.auth.getSession();

    if (!existingSession) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (signUpError) {
        const message = signUpError.message.toLowerCase().includes("already registered")
          ? "Este email já tem uma conta. Entre pela tela de login."
          : "Não foi possível criar a conta. Tente novamente.";
        setError("root", { message });
        return;
      }

      if (!signUpData.session) {
        setError("root", {
          message: "Cadastro criado, mas o login automático falhou. Tente entrar novamente.",
        });
        router.replace("/login");
        return;
      }
    }

    const { error: storeError } = await supabase.rpc("create_store_with_owner", {
      store_name: data.storeName,
      owner_name: data.email,
      monthly_goal: 0,
      store_cnpj: data.cnpj,
    });

    if (storeError) {
      setError("root", {
        message: "Conta criada, mas não foi possível cadastrar a empresa. Tente novamente.",
      });
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>
        <p className="text-center text-sm text-muted-foreground">Cadastre sua empresa para começar.</p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="storeName">Nome da empresa</Label>
            <Input id="storeName" placeholder="Ex: iStore Centro" {...register("storeName")} />
            {errors.storeName && <span className="text-xs text-danger">{errors.storeName.message}</span>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input id="cnpj" placeholder="00.000.000/0000-00" {...register("cnpj")} />
            {errors.cnpj && <span className="text-xs text-danger">{errors.cnpj.message}</span>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="voce@loja.com" {...register("email")} />
            {errors.email && <span className="text-xs text-danger">{errors.email.message}</span>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && <span className="text-xs text-danger">{errors.password.message}</span>}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Criando..." : "Criar conta"}
          </Button>
          {errors.root && <span className="text-xs text-danger">{errors.root.message}</span>}
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="text-primary underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
