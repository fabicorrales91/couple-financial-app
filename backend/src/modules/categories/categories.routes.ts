import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { requireAuth } from "../../middleware/auth";
import { HttpError } from "../../lib/http-error";
import { prisma } from "../../lib/prisma";

export const categoriesRouter = Router();

categoriesRouter.use(requireAuth);

categoriesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    if (!req.auth) throw HttpError.unauthorized();

    const categories = await prisma.category.findMany({
      where: {
        OR: [{ ownerUserId: null }, { ownerUserId: req.auth.userId }],
      },
      orderBy: { name: "asc" },
    });

    res.json({ categories });
  })
);
