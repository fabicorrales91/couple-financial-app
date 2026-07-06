import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { requireAuth } from "../../middleware/auth";
import { HttpError } from "../../lib/http-error";
import { createInviteSchema, redeemInviteSchema } from "./invites.schemas";
import { createInvite, redeemInvite, revokeInvite } from "./invites.service";

export const invitesRouter = Router();

invitesRouter.use(requireAuth);

invitesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    if (!req.auth) throw HttpError.unauthorized();
    const body = createInviteSchema.parse(req.body);
    const invite = await createInvite(req.auth.userId, body);
    res.status(201).json({ invite });
  })
);

invitesRouter.post(
  "/redeem",
  asyncHandler(async (req, res) => {
    if (!req.auth) throw HttpError.unauthorized();
    const body = redeemInviteSchema.parse(req.body);
    const result = await redeemInvite(req.auth.userId, body.code);
    res.status(200).json(result);
  })
);

invitesRouter.post(
  "/:id/revoke",
  asyncHandler(async (req, res) => {
    if (!req.auth) throw HttpError.unauthorized();
    const inviteId = req.params.id;
    if (!inviteId) throw HttpError.badRequest("Falta el id de la invitacion");
    await revokeInvite(req.auth.userId, inviteId);
    res.status(204).send();
  })
);
