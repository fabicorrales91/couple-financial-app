import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import {
  assertAccountAccessible,
  assertCanSendTo,
} from "../accounts/accounts.service";
import type { z } from "zod";
import type { createTransactionSchema } from "./transactions.schemas";

type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

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
      createdBy: userId,
      occurredAt: input.occurredAt ?? new Date(),
    },
  });

  return transaction;
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
