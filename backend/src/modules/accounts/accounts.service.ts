import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/http-error";

/**
 * Cuentas a las que un usuario tiene acceso: su cuenta personal
 * y cualquier cuenta de grupo de la que sea miembro.
 */
export async function getMyAccounts(userId: string) {
  const accounts = await prisma.account.findMany({
    where: {
      OR: [{ ownerUserId: userId }, { memberships: { some: { userId } } }],
    },
    include: {
      memberships: { include: { user: { select: { id: true, email: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const withBalances = await Promise.all(
    accounts.map(async (account) => ({
      id: account.id,
      type: account.type,
      name: account.name,
      isOwn: account.ownerUserId === userId,
      roleInGroup:
        account.memberships.find((m) => m.userId === userId)?.roleInGroup ??
        null,
      balance: await getAccountBalance(account.id),
    }))
  );

  return withBalances;
}

export async function getAccountBalance(accountId: string): Promise<string> {
  const [incoming, outgoing] = await Promise.all([
    prisma.transaction.aggregate({
      where: { toAccountId: accountId },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { fromAccountId: accountId },
      _sum: { amount: true },
    }),
  ]);

  const inSum = incoming._sum.amount ?? new Prisma.Decimal(0);
  const outSum = outgoing._sum.amount ?? new Prisma.Decimal(0);

  return inSum.minus(outSum).toFixed(2);
}

/**
 * Confirma que el usuario puede operar (registrar movimientos) desde esta cuenta:
 * es su cuenta personal, o es miembro del grupo dueno de la cuenta.
 */
export async function assertAccountAccessible(userId: string, accountId: string) {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: { memberships: true },
  });

  if (!account) {
    throw HttpError.notFound("Cuenta no encontrada");
  }

  const isOwner = account.ownerUserId === userId;
  const isMember = account.memberships.some((m) => m.userId === userId);

  if (!isOwner && !isMember) {
    throw HttpError.forbidden("No tienes acceso a esta cuenta");
  }

  return account;
}

/**
 * Confirma que el usuario puede enviar dinero HACIA esta cuenta destino:
 * su propia cuenta, un grupo del que es miembro, o la cuenta personal
 * de un contacto con vinculo aceptado.
 */
export async function assertCanSendTo(userId: string, toAccountId: string) {
  const account = await prisma.account.findUnique({
    where: { id: toAccountId },
    include: { memberships: true },
  });

  if (!account) {
    throw HttpError.notFound("Cuenta destino no encontrada");
  }

  if (account.ownerUserId === userId) return account;
  if (account.memberships.some((m) => m.userId === userId)) return account;

  if (account.type === "personal" && account.ownerUserId) {
    const contact = await prisma.contact.findFirst({
      where: {
        status: "accepted",
        OR: [
          { userIdA: userId, userIdB: account.ownerUserId },
          { userIdA: account.ownerUserId, userIdB: userId },
        ],
      },
    });

    if (contact) return account;
  }

  throw HttpError.forbidden(
    "No puedes enviar dinero a esta cuenta: no hay un vinculo (grupo o contacto aceptado) con su titular"
  );
}
