import { z } from "zod";

const emailField = z.string().trim().min(1, "Digite seu email.").email("Digite um email válido.");

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Digite sua senha."),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Supabase Auth hashes with bcrypt, which only reads the first 72 bytes, and rejects longer passwords.
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

const newPasswordField = z
  .string()
  .min(1, "Digite uma senha.")
  .min(PASSWORD_MIN, `A senha precisa ter pelo menos ${PASSWORD_MIN} caracteres.`)
  .max(PASSWORD_MAX, `A senha pode ter no máximo ${PASSWORD_MAX} caracteres.`);

export const PASSWORD_HINT = "Mínimo 8 caracteres. Use letras, números e símbolos para maior segurança.";

export const recoverPasswordSchema = z.object({ email: emailField });
export type RecoverPasswordInput = z.infer<typeof recoverPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: newPasswordField,
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem.",
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const signupSchema = z
  .object({
    email: emailField,
    password: newPasswordField,
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem.",
  });

export type SignupInput = z.infer<typeof signupSchema>;
