import crypto from "node:crypto";
import { prisma } from "../../lib/prisma";
import { env } from "../../lib/env";
import { HttpError } from "../../lib/http-error";

function generateCode(): string {
  return crypto.randomBytes(6).toString("base64url");
}

/**
 * Crea una invitacion. Para type "contact", target_id apunta al propio
 * creador (no hay un objetivo conocido hasta que alguien la canjea).
 * Para type "group", target_id es la cuenta de grupo, y solo un admin
 * de ese grupo puede generar el codigo.
 */
export async function createInvite(
  userId: string,
  input: { type: "contact" } | { type: "group"; groupAccountId: string }
) {
  let targetId: string;

  if (input.type === "group") {
    const membership = await prisma.groupMembership.findUnique({
      where: {
        accountId_userId: { accountId: input.groupAccountId, userId },
      },
    });

    if (!membership || membership.roleInGroup !== "admin") {
      throw HttpError.forbidden("Solo un admin del grupo puede invitar miembros");
    }

    targetId = input.groupAccountId;
  } else {
    targetId = userId;
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.inviteExpirationDays);

  const invite = await prisma.invite.create({
    data: {
      type: input.type,
      targetId,
      code: generateCode(),
      createdBy: userId,
      expiresAt,
    },
  });

  return invite;
}

export async function redeemInvite(userId: string, code: string) {
  const invite = await prisma.invite.findUnique({ where: { code } });

  if (!invite) throw HttpError.notFound("Codigo de invitacion invalido");
  if (invite.revokedAt) throw HttpError.badRequest("Esta invitacion fue revocada");
  if (invite.usedAt) throw HttpError.badRequest("Esta invitacion ya fue usada");
  if (invite.expiresAt < new Date()) {
    throw HttpError.badRequest("Esta invitacion ha expirado");
  }
  if (invite.createdBy === userId) {
    throw HttpError.badRequest("No puedes canjear tu propia invitacion");
  }

  if (invite.type === "contact") {
    await linkContacts(invite.createdBy, userId);
  } else {
    await joinGroup(invite.targetId, userId);
  }

  await prisma.invite.update({
    where: { id: invite.id },
    data: { usedBy: userId, usedAt: new Date() },
  });

  return { type: invite.type, targetId: invite.targetId };
}

async function linkContacts(userIdA: string, userIdB: string) {
  const existing = await prisma.contact.findFirst({
    where: {
      OR: [
        { userIdA, userIdB },
        { userIdA: userIdB, userIdB: userIdA },
      ],
    },
  });

  if (existing) {
    if (existing.status !== "accepted") {
      await prisma.contact.update({
        where: { id: existing.id },
        data: { status: "accepted" },
      });
    }
    return;
  }

  await prisma.contact.create({
    data: { userIdA, userIdB, status: "accepted" },
  });
}

async function joinGroup(accountId: string, userId: string) {
  const existing = await prisma.groupMembership.findUnique({
    where: { accountId_userId: { accountId, userId } },
  });

  if (existing) {
    throw HttpError.conflict("Ya perteneces a este grupo");
  }

  await prisma.groupMembership.create({
    data: { accountId, userId, roleInGroup: "member" },
  });
}

export async function revokeInvite(userId: string, inviteId: string) {
  const invite = await prisma.invite.findUnique({ where: { id: inviteId } });

  if (!invite) throw HttpError.notFound("Invitacion no encontrada");
  if (invite.createdBy !== userId) {
    throw HttpError.forbidden("Solo quien creo la invitacion puede revocarla");
  }
  if (invite.usedAt) {
    throw HttpError.badRequest("Esta invitacion ya fue canjeada, no se puede revocar");
  }
  if (invite.revokedAt) {
    throw HttpError.badRequest("Esta invitacion ya estaba revocada");
  }

  await prisma.invite.update({
    where: { id: inviteId },
    data: { revokedAt: new Date() },
  });
}
