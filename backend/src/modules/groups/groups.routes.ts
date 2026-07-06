import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { requireAuth } from "../../middleware/auth";
import { HttpError } from "../../lib/http-error";
import { createGroupSchema } from "./groups.schemas";
import { createGroup } from "./groups.service";

export const groupsRouter = Router();

groupsRouter.use(requireAuth);

groupsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    if (!req.auth) throw HttpError.unauthorized();
    const body = createGroupSchema.parse(req.body);
    const account = await createGroup(req.auth.userId, body.name);
    res.status(201).json({ account });
  })
);
