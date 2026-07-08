import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { requireAuth } from "../../middleware/auth";
import { HttpError } from "../../lib/http-error";
import { createAccountSchema } from "./accounts.schemas";
import { getMyAccounts, createPersonalAccount, deleteAccount } from "./accounts.service";

export const accountsRouter = Router();

accountsRouter.use(requireAuth);

accountsRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    if (!req.auth) throw HttpError.unauthorized();
    const accounts = await getMyAccounts(req.auth.userId);
    res.json({ accounts });
  })
);

accountsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    if (!req.auth) throw HttpError.unauthorized();
    const body = createAccountSchema.parse(req.body);
    const account = await createPersonalAccount(req.auth.userId, body.name, body.currency);
    res.status(201).json({ account });
  })
);

accountsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    if (!req.auth) throw HttpError.unauthorized();
    await deleteAccount(req.auth.userId, req.params.id);
    res.status(204).send();
  })
);
