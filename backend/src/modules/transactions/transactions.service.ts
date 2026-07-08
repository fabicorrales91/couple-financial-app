import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/http-error";
import {
  assertAccountAccessible,
  assertCanSendTo,
} from "../accounts/accounts.service";
import type { z } from "zod";
import type { createTransactionSchema, updateTransactionSchema } from "./transactions.schemas";

type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

export async function createTransaction(
  userId: string,
  input: CreateTransactionInput
) {
  if (input.type === "gasto") {
    await assertAccountAccessible(userId, input.fromAccountId);
  } else if (input.type === "ingreso") {
    await assertAccountAccessible(userId, input.toAccountId);
  } else {
    await assertAccountAccessible(userId, input.fromAccountId);
    await assertCanSendTo(userId, input.toAccountId);
  }

  const transaction = await prisma.transaction.create({
    data: {
      type: input.type,
      fromAccountId: "fromAccountId" in input ? input.fromAccountId : null,
      toAccountId: "toAccountId" in input ? input.toAccountId : null,
      amount: input.amount,
      categoryId: input.categoryId ?? null,
      concept: input.concept,
      isRemesa: input.isRemesa ?? false,
      createdBy: userId,
      occurredAt: input.occurredAt ?? new Date(),
    },
  });

  return transaction;
}

/**
 * Edita monto, categoria y/o concepto de un movimiento ya registrado. No
 * permite cambiar tipo ni cuentas origen/destino (eso equivale a borrar y
 * crear uno nuevo, evita reglas de validacion cruzadas mas complejas).
 * El acceso se valida contra la cuenta involucrada (origen o destino, la que
 * exista), igual que el resto de operaciones sobre movimientos.
 */
export async function updateTransaction(
  userId: string,
  transactionId: string,
  input: UpdateTransactionInput
) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    throw HttpError.notFound("Movimiento no encontrado");
  }

  const accountId = transaction.fromAccountId ?? transaction.toAccountId;
  if (!accountId) {
    throw HttpError.notFound("Movimiento no encontrado");
  }
  await assertAccountAccessible(userId, accountId);

  return prisma.transaction.update({
    where: { id: transactionId },
    data: {
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.concept !== undefined ? { concept: input.concept } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
    },
    include: { category: true },
  });
}

export async function listTransactionsForAccount(
  userId: string,
  accountId: string,
  limit: number,
  categoryId?: "none" | string
) {
  await assertAccountAccessible(userId, accountId);

  const categoryFilter =
    categoryId === undefined
      ? {}
      : categoryId === "none"
        ? { categoryId: null }
        : { categoryId };

  return prisma.transaction.findMany({
    where: {
      OR: [{ fromAccountId: accountId }, { toAccountId: accountId }],
      ...categoryFilter,
    },
    orderBy: { occurredAt: "desc" },
    take: limit,
    include: { category: true },
  });
}

/**
 * Trae TODO el historial de una cuenta (sin limite de paginacion), para
 * exportar. A diferencia de listTransactionsForAccount, orden cronologico
 * ascendente (lectura natural de un extracto) e incluye el nombre de las
 * cuentas origen/destino para que el archivo tenga sentido por si solo, sin
 * tener que cruzar IDs con otra pantalla.
 */
export async function listAllTransactionsForExport(userId: string, accountId: string) {
  await assertAccountAccessible(userId, accountId);

  return prisma.transaction.findMany({
    where: {
      OR: [{ fromAccountId: accountId }, { toAccountId: accountId }],
    },
    orderBy: { occurredAt: "asc" },
    include: {
      category: true,
      fromAccount: { select: { name: true } },
      toAccount: { select: { name: true } },
    },
  });
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

type ExportableTransaction = Awaited<ReturnType<typeof listAllTransactionsForExport>>[number];

/**
 * Genera el CSV del extracto de una cuenta. El signo del monto es relativo a
 * la cuenta exportada (igual que en la lista de movimientos de la app), no
 * el monto crudo de la fila, para que el archivo se lea igual que la pantalla.
 * Incluye BOM UTF-8 al inicio porque Excel en Windows, sin eso, interpreta
 * mal los acentos.
 */
export function buildTransactionsCsv(transactions: ExportableTransaction[], accountId: string): string {
  const header = ["Fecha", "Tipo", "Concepto", "Categoria", "Cuenta origen", "Cuenta destino", "Monto", "Remesa"];
  const rows = transactions.map((tx) => {
    const sign = tx.toAccountId === accountId ? "" : tx.fromAccountId === accountId ? "-" : "";
    const amount = `${sign}${tx.amount.toFixed(2)}`;
    return [
      tx.occurredAt.toISOString().slice(0, 10),
      tx.type,
      tx.concept,
      tx.category?.name ?? "Sin categoria",
      tx.fromAccount?.name ?? "",
      tx.toAccount?.name ?? "",
      amount,
      tx.isRemesa ? "Si" : "No",
    ]
      .map((field) => csvEscape(String(field)))
      .join(",");
  });

  const BOM = "﻿";
  return BOM + [header.join(","), ...rows].join("\n") + "\n";
}

function parseMonthLabel(label: string): { year: number; monthIndex: number } {
  const parts = label.split("-");
  const year = Number(parts[0]);
  const monthIndex = Number(parts[1]);
  return { year, monthIndex };
}

function monthRange(month?: string) {
  const now = new Date();
  const { year, monthIndex } = month
    ? parseMonthLabel(month)
    : { year: now.getUTCFullYear(), monthIndex: now.getUTCMonth() + 1 };

  const start = new Date(Date.UTC(year, monthIndex - 1, 1));
  const end = new Date(Date.UTC(year, monthIndex, 1));

  return { start, end, label: `${year}-${String(monthIndex).padStart(2, "0")}` };
}

function previousMonthLabel(label: string) {
  const { year, monthIndex } = parseMonthLabel(label);
  const prevDate = new Date(Date.UTC(year, monthIndex - 2, 1));
  return `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function getMonthlySummary(
  userId: string,
  accountId: string,
  month: string | undefined
) {
  await assertAccountAccessible(userId, accountId);

  const { start, end, label } = monthRange(month);
  const { start: prevStart, end: prevEnd } = monthRange(previousMonthLabel(label));

  const [gastoAgg, ingresoAgg, prevGastoAgg, gastosPorCategoria] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        fromAccountId: accountId,
        type: "gasto",
        occurredAt: { gte: start, lt: end },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        toAccountId: accountId,
        type: "ingreso",
        occurredAt: { gte: start, lt: end },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        fromAccountId: accountId,
        type: "gasto",
        occurredAt: { gte: prevStart, lt: prevEnd },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        fromAccountId: accountId,
        type: "gasto",
        occurredAt: { gte: start, lt: end },
      },
      _sum: { amount: true },
    }),
  ]);

  const categoryIds = gastosPorCategoria
    .map((row) => row.categoryId)
    .filter((id): id is string => id !== null);

  const categories = categoryIds.length
    ? await prisma.category.findMany({ where: { id: { in: categoryIds } } })
    : [];

  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  const zero = new Prisma.Decimal(0);
  const totalGasto = (gastoAgg._sum.amount ?? zero).toFixed(2);
  const totalIngreso = (ingresoAgg._sum.amount ?? zero).toFixed(2);
  const previousTotalGasto = (prevGastoAgg._sum.amount ?? zero).toFixed(2);

  const byCategory = gastosPorCategoria
    .map((row) => ({
      categoryId: row.categoryId,
      categoryName: row.categoryId
        ? categoryNameById.get(row.categoryId) ?? "Categoria eliminada"
        : "Sin categoria",
      total: (row._sum.amount ?? zero).toFixed(2),
    }))
    .sort((a, b) => Number(b.total) - Number(a.total));

  return {
    month: label,
    totalGasto,
    totalIngreso,
    previousMonthTotalGasto: previousTotalGasto,
    byCategory,
  };
}
