"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthCard, authInputClass } from "@/components/auth-card";
import { LegalModal, type LegalDocument } from "@/components/legal-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/toaster";
import { authErrorMessage } from "@/lib/auth/auth-errors";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import { signupSchema, type SignupInput, PASSWORD_HINT } from "@/lib/validation/auth";

// Requires "Confirm email" to be OFF in Supabase (Authentication > Sign In / Providers > Email),
// so signUp returns a session right away. Keep it off until the Asaas payment flow exists.
const TERMS_REQUIRED_MESSAGE = "Você precisa aceitar os termos para continuar.";

const legalLinkStyle = { color: "#dae878", cursor: "pointer", textDecoration: "underline" } as const;

export default function SignupPage() {
  const router = useRouter();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [openDocument, setOpenDocument] = useState<LegalDocument | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(data: SignupInput) {
    if (!acceptedTerms) {
      toast.error(TERMS_REQUIRED_MESSAGE);
      return;
    }

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
      <form
        className="mt-8 flex flex-col gap-4"
        onSubmit={(event) => {
          // Checked before field validation so Enter with the box unticked still explains why nothing happened.
          if (!acceptedTerms) {
            event.preventDefault();
            toast.error(TERMS_REQUIRED_MESSAGE);
            return;
          }
          void handleSubmit(onSubmit)(event);
        }}
        noValidate
      >
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
            placeholder="Mínimo de 8 caracteres"
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
        <label htmlFor="acceptTerms" className="flex items-start gap-3 text-sm leading-relaxed text-[#D0D0D0]">
          <input
            id="acceptTerms"
            type="checkbox"
            required
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[#dae878]"
          />
          <span>
            Eu li e aceito os{" "}
            <span
              role="button"
              tabIndex={0}
              style={legalLinkStyle}
              onClick={(event) => {
                event.preventDefault();
                setOpenDocument("terms");
              }}
              onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), setOpenDocument("terms"))}
            >
              Termos de Uso
            </span>{" "}
            e a{" "}
            <span
              role="button"
              tabIndex={0}
              style={legalLinkStyle}
              onClick={(event) => {
                event.preventDefault();
                setOpenDocument("privacy");
              }}
              onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), setOpenDocument("privacy"))}
            >
              Política de Privacidade
            </span>{" "}
            do useFindash.
          </span>
        </label>
        <Button
          type="submit"
          disabled={isSubmitting}
          aria-disabled={!acceptedTerms}
          style={acceptedTerms ? undefined : { opacity: 0.5, pointerEvents: "none" }}
          className="mt-2 h-11 rounded-lg font-semibold"
        >
          {isSubmitting ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-[#666666] hover:text-foreground">
          Já tenho conta
        </Link>
      </p>

      <LegalModal document={openDocument} onClose={() => setOpenDocument(null)} />
      <Toaster />
    </AuthCard>
  );
}
