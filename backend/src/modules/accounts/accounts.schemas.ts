import { z } from "zod";

export const createAccountSchema = z.object({
  name: z.string().min(1).max(80),
  currency: z
    .string()
    .trim()
    .length(3, "Usa un codigo ISO 4217 de 3 letras, ej: EUR, COP, USD")
    .regex(/^[A-Za-z]{3}$/, "Usa un codigo ISO 4217 de 3 letras, ej: EUR, COP, USD")
    .transform((v) => v.toUpperCase())
    .optional()
    .default("EUR"),
});
