import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { loginSchema, registerSchema } from "./auth.schemas";
import { loginUser, registerUser } from "./auth.service";

export const authRouter = Router();

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);
    const result = await registerUser(body);
    res.status(201).json(result);
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const result = await loginUser(body);
    res.status(200).json(result);
  })
);
