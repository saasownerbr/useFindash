import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Digite seu email.").email("Digite um email válido."),
});

export type LoginInput = z.infer<typeof loginSchema>;
