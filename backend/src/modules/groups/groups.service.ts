import { prisma } from "../../lib/prisma";

export async function createGroup(userId: string, name: string) {
  const account = await prisma.$transaction(async (tx) => {
    const createdAccount = await tx.account.create({
      data: {
        type: "group",
        name,
        ownerUserId: null,
      },
    });

    await tx.groupMembership.create({
      data: {
        accountId: createdAccount.id,
        userId,
        roleInGroup: "admin",
      },
    });

    return createdAccount;
  });

  return account;
}
