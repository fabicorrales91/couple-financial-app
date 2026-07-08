import { z } from "zod";

const baseFields = {
  amount: z.number().positive(),
  categoryId: z.string().uuid().optional(),
  concept: z.string().min(1).max(200),
  occurredAt: z.coerce.date().optional(),
  // Marca envio/recepcion de dinero entre paises o monedas (remesa). No
  // implica necesariamente una transferencia interna entre cuentas propias:
  // tambien aplica a un gasto (envio via un tercero) o un ingreso (recepcion).
  isRemesa: z.boolean().optional().default(false),
};

export const createTransactionSchema = z
  .discriminatedUnion("type", [
    z.object({
      type: z.literal("gasto"),
      fromAccountId: z.string().uuid(),
      ...baseFields,
    }),
    z.object({
      type: z.literal("ingreso"),
      toAccountId: z.string().uuid(),
      ...baseFields,
    }),
    z.object({
      type: z.literal("transferencia"),
      fromAccountId: z.string().uuid(),
      toAccountId: z.string().uuid(),
      ...baseFields,
    }),
  ])
  .refine(
    (data) => data.type !== "transferencia" || data.fromAccountId !== data.toAccountId,
    {
      message: "La cuenta origen y destino no pueden ser la misma",
      path: ["toAccountId"],
    }
  );

export const listTransactionsSchema = z.object({
  accountId: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  // "none" filtra movimientos sin categoria asignada. Un uuid filtra por esa categoria.
  categoryId: z.union([z.literal("none"), z.string().uuid()]).optional(),
});

export const monthlySummarySchema = z.object({
  accountId: z.string().uuid(),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Formato esperado: YYYY-MM")
    .optional(),
});

export const exportTransactionsSchema = z.object({
  accountId: z.string().uuid(),
});
