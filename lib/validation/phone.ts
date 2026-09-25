import { z } from "zod";

import { phoneDigits } from "@/lib/phone";

const MESSAGE = "Informe um WhatsApp válido com DDD";

/** Any typing in, DDD + number digits out (10 for landlines, 11 for mobiles). */
export const requiredPhone = z.string().transform(phoneDigits).pipe(z.string().regex(/^\d{10,11}$/, MESSAGE));

/** Same as requiredPhone, but blank is allowed and comes out as "". */
export const optionalPhone = z
  .string()
  .optional()
  .transform((value) => (value ? phoneDigits(value) : ""))
  .pipe(z.string().regex(/^(\d{10,11})?$/, MESSAGE));
