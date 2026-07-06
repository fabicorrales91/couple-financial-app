import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma";
import { env } from "../../lib/env";
import { HttpError } from "../../lib/http-error";

const SALT_ROUNDS = 12;

export async function registerUser(params: {
  email: string;
  password: string;
  name: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: params.email },
  });

  if (existing) {
    throw HttpError.conflict("Ya existe una cuenta con ese correo");
  }

  const passwordHash = await bcrypt.hash(params.password, SALT_ROUNDS);

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email: params.email,
        passwordHash,
      },
    });

    await tx.account.create({
      data: {
        type: "personal",
        name: params.name,
        ownerUserId: createdUser.id,
      },
    });

    return createdUser;
  });

  return issueToken(user.id, user.roleGlobal);
}

export async function loginUser(params: { email: string; password: string }) {
  const user = await prisma.user.findUnique({
    where: { email: params.email },
  });

  if (!user) {
    throw HttpError.unauthorized("Credenciales invalidas");
  }

  const valid = await bcrypt.compare(params.password, user.passwordHash);
  if (!valid) {
    throw HttpError.unauthorized("Credenciales invalidas");
  }

  return issueToken(user.id, user.roleGlobal);
}

function issueToken(userId: string, roleGlobal: "admin" | "user") {
  const token = jwt.sign({ userId, roleGlobal }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions);

  return { token };
}
