import { z } from "zod";

import { normalizeCnpj } from "@/lib/validation/cnpj";

const emailField = z.string().trim().min(1, "Digite seu email.").email("Digite um email válido.");

export const loginSchema = z.object({
  email: emailField,
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  storeName: z.string().trim().min(2, "Nome da empresa precisa ter pelo menos 2 caracteres."),
  cnpj: z
    .string()
    .trim()
    .min(1, "Digite o CNPJ.")
    .transform(normalizeCnpj)
    .refine((value) => value.length === 14, "CNPJ precisa ter 14 dígitos."),
  email: emailField,
});

export type SignupInput = z.infer<typeof signupSchema>;
