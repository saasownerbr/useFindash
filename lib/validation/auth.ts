import { z } from "zod";

import { normalizeCnpj } from "@/lib/validation/cnpj";

export const passwordSchema = z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.");

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Digite seu email.").email("Digite um email válido."),
  password: z.string().min(1, "Digite sua senha."),
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
  email: z.string().trim().min(1, "Digite seu email.").email("Digite um email válido."),
  password: passwordSchema,
});

export type SignupInput = z.infer<typeof signupSchema>;
