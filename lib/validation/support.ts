import { z } from "zod";

export const SUPPORT_MESSAGE_MAX = 500;

/** Formats digits as the user types: (11) 99999-9999, or (11) 9999-9999 for landlines. */
export function formatWhatsapp(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export const supportSchema = z.object({
  description: z
    .string()
    .trim()
    .min(10, "Descreva o problema com mais detalhes")
    .max(SUPPORT_MESSAGE_MAX, `Máximo de ${SUPPORT_MESSAGE_MAX} caracteres`),
  // Accepts the masked value; keeps only the digits.
  whatsapp: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().regex(/^\d{10,11}$/, "Informe o WhatsApp com DDD")),
});

export type SupportInput = z.input<typeof supportSchema>;
