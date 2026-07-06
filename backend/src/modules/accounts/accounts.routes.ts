import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { requireAuth } from "../../middleware/auth";
import { HttpError } from "../../lib/http-error";
import { getMyAccounts } from "./accounts.service";

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
