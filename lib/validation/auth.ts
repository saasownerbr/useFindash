import { z } from "zod";

const emailField = z.string().trim().min(1, "Digite seu email.").email("Digite um email válido.");

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Digite sua senha."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    email: emailField,
    password: z.string().min(1, "Digite uma senha.").min(6, "A senha precisa ter pelo menos 6 caracteres."),
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem.",
  });

export type SignupInput = z.infer<typeof signupSchema>;
